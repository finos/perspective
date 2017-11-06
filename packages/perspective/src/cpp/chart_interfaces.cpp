/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/base.h>
#define NO_IMPORT_ARRAY
#define PY_ARRAY_UNIQUE_SYMBOL _perspectiveNumpy
#include <numpy/arrayobject.h>
SUPPRESS_WARNINGS_GCC(-Wreorder)
#include <chartdir/chartdir.h>
RESTORE_WARNINGS_GCC()
#include <perspective/raii.h>
#include <perspective/sym_table.h>
#include <perspective/chart_interfaces.h>
#include <perspective/pythonhelpers.h>
#include <perspective/config.h>
#include <perspective/min_max.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/flat_traversal.h>
#include <perspective/sparse_tree.h>

namespace perspective
{

t_leaf_data_iter_base::t_leaf_data_iter_base() : m_valid(false)
{
}

bool
t_leaf_data_iter_base::valid() const
{
    return m_valid;
}

const t_tscalvec& t_leaf_data_iter_base::operator*() const
{
    return m_current_row;
}
const t_tscalvec* t_leaf_data_iter_base::operator->() const
{
    return &m_current_row;
}

inline t_str
t_leaf_data_iter_base::make_row_label(const t_svec& plabels,
                                      t_str& value)
{
    std::stringstream label;

    for (auto lit = plabels.begin(); lit != plabels.end(); ++lit)
    {
        label << *lit << "/";
    }

    label << value;
    return label.str();
}

void
t_leaf_data_iter_base::increment()
{
}

inline t_tscalar
chartdir_time_to_scalar(t_float64 cd_time)
{
#ifdef PSP_ENABLE_WASM
    return mknone();
#else
    static t_float64 s_cd_epoch = Chart::chartTime(1970, 1, 1);

    t_time asgpivot_time(static_cast<boost::int64_t>(
        (cd_time - s_cd_epoch) * 1000000));
    t_tscalar ret;
    ret.set(asgpivot_time);
    return ret;
#endif
}

inline t_float64
scalar_to_chartdir_double(const t_tscalar& sv, const t_index& dtype)
{
#ifdef PSP_ENABLE_WASM
    return 0;
#else
    t_float64 dv = Chart::NoValue;

    if (!sv.is_valid())
        return dv;

    static t_float64 s_cd_epoch = Chart::chartTime(1970, 1, 1);

    switch (dtype)
    {
        case DTYPE_DATE:
        {
            t_date dvalue = sv.get<t_date>();

            dv = Chart::chartTime(
                dvalue.year(), dvalue.month(), dvalue.day());
        }
        break;

        case DTYPE_TIME:
        {
            t_time tvalue = sv.get<t_time>();
            dv = s_cd_epoch + tvalue.as_seconds() +
                 tvalue.microseconds() / 1000000.0;
        }
        break;

        default:
        {
            if (sv.is_numeric())
                dv = sv.to_double();
            else
                dv = Chart::NoValue;
        }
    };

    return dv;
#endif
}

// A bin is four numbers: (open, hi, lo, close), in that order.
// This method reserves space for a bin and initializes the values
// to the first x_value known and Chart::NoValue as placeholder for
// other columns.
inline t_uindex
init_numeric_bin(std::vector<void*>& out,
                 t_uindex ridx,
                 t_float64 x_value)
{
    t_float64* x_col_ptr = static_cast<t_float64*>(out[0]);

    for (t_uindex bi = 0; bi < 4; bi++)
    {
        x_col_ptr[ridx] = x_value;

        for (size_t aidx = 1; aidx < out.size(); aidx++)
        {
            t_float64* col_ptr = static_cast<t_float64*>(out[aidx]);
            col_ptr[ridx] = Chart::NoValue;
        }
        ++ridx;
    }

    return ridx;
}

// if bin represents few rows, all four values are not needed so
// reduce it
inline t_uindex
contract_numeric_bin(std::vector<void*>& out,
                     t_uindex ridx,
                     t_uindex count)
{
    if (ridx < 4)
        return ridx;

    switch (count)
    {
        case 1:
            return ridx - 3;

        case 2:
        {
            for (size_t aidx = 1; aidx < out.size(); aidx++)
            {
                t_float64* col_ptr =
                    static_cast<t_float64*>(out[aidx]);
                col_ptr[ridx - 3] = col_ptr[ridx - 1];
            }
            return ridx - 2;
        }

        default:
            return ridx;
    }
}

// update array (column) aidx in current bin with value.
inline void
update_numeric_bin(std::vector<void*>& out,
                   t_uindex ridx,
                   t_float64 aidx,
                   t_float64 value)
{
    t_float64* col_ptr = static_cast<t_float64*>(out[aidx]);

    // skip NaNs altogether
    if (value != Chart::NoValue)
    {
        // always update the "close" point
        col_ptr[ridx - 1] = value;

        // the first valid point found is written to all entries
        if (col_ptr[ridx - 4] == Chart::NoValue)
        {
            col_ptr[ridx - 4] = value;
            col_ptr[ridx - 3] = value;
            col_ptr[ridx - 2] = value;
        }
        // otherwise need only update min and max
        else
        {
            if (col_ptr[ridx - 2] < value)
                col_ptr[ridx - 2] = value;

            if (col_ptr[ridx - 3] > value)
                col_ptr[ridx - 3] = value;
        }
    }
}

#ifdef PSP_ENABLE_PYTHON
// read rows from iterator and store in the numpy array columns,
// but bin on the first column's values (x-value) to reduce the
// result.
// NOTE: Only all-numeric data is supported.
template <typename ITER_T>
inline t_uindex
_iter_into_numpy_arrays_binned(ITER_T& iter,
                               std::vector<void*>& out,
                               t_uindex ridx,
                               t_uindex ridx_max,
                               t_float64 xlimit,
                               t_float64 xlo,
                               t_float64 xhi,
                               const t_idxvec& idxs,
                               const t_idxvec& types)
{
    t_float64* x_col_ptr = static_cast<t_float64*>(out[0]);
    t_float64 start_x = 0.0;
    t_float64 this_x = 0.0;
    t_uindex this_count = 0;

    while (iter.valid())
    {
        const t_tscalvec& row = *iter;

        for (size_t aidx = 0; aidx < idxs.size(); aidx++)
        {
            // this function is only available for numeric data
            t_float64 dv =
                scalar_to_chartdir_double(row[aidx], types[aidx]);

            // x-value
            if (aidx == 0)
            {
                this_x = dv;

                // skip row not in range?
                if (xlo < xhi && (this_x < xlo || this_x > xhi))
                {
                    --this_count;
                    break;
                }

                // starting new bin?
                if (ridx == 0 || this_x > start_x + xlimit)
                {
                    if (ridx + 4 >= ridx_max)
                    {
                        // output arrays are of insufficient length -
                        // break off
                        ridx = contract_numeric_bin(
                            out, ridx, this_count);
                        return ridx;
                    }

                    ridx =
                        contract_numeric_bin(out, ridx, this_count);
                    ridx = init_numeric_bin(out, ridx, this_x);

                    start_x = this_x;
                    this_count = 0;
                }
                else if (this_x < start_x)
                {
                    PyErr_Format(
                        PyExc_IndexError,
                        "context_into_numpy_arrays: x-values out of "
                        "order; disable pruning or sort the "
                        "context.");
                    return -1;
                }
                else
                {
                    x_col_ptr[ridx - 3] =
                        0.5 * start_x + 0.5 * this_x;
                    x_col_ptr[ridx - 2] =
                        0.5 * start_x + 0.5 * this_x;
                    x_col_ptr[ridx - 1] = this_x;
                }
            }

            // other values
            else
            {
                update_numeric_bin(out, ridx, aidx, dv);
            }
        }

        if (xlo < xhi && this_x > xhi)
            break;

        ++this_count;
        ++iter;
    }

    ridx = contract_numeric_bin(out, ridx, this_count);
    return ridx;
}

// read rows from iterator and store directly in the numpy array
// columns
template <typename ITER_T>
inline t_uindex
_iter_into_numpy_arrays_simple(ITER_T& iter,
                               std::vector<void*>& out,
                               t_uindex ridx,
                               t_uindex ridx_max,
                               t_float64 xlo,
                               t_float64 xhi,
                               const t_idxvec& idxs,
                               const t_idxvec& types)
{
    t_float64 this_x = 0.0;

    // interpret and copy the data
    while (iter.valid())
    {
        const t_tscalvec& row = *iter;

        for (size_t aidx = 0; aidx < idxs.size(); aidx++)
        {
            t_index dtype = types[aidx];
            t_tscalar sv = row[aidx];

            switch (dtype)
            {
                case DTYPE_STR:
                {
                    PyObject** py_objs =
                        reinterpret_cast<PyObject**>(out[aidx]);
                    Py_DECREF(py_objs[ridx]);
                    py_objs[ridx] =
                        PyString_FromString(sv.to_string().c_str());
                    continue; // note: this is the only non-t_float64
                              // valued case
                }
                break;

                default:
                {
                    t_float64* col_ptr =
                        static_cast<t_float64*>(out[aidx]);
                    t_float64 dv =
                        scalar_to_chartdir_double(sv, dtype);

                    if (aidx == 0)
                    {
                        this_x = dv;

                        // skip row not in range?
                        if (xlo < xhi && (dv < xlo || dv > xhi))
                        {
                            --ridx;
                            break;
                        }
                    }

                    col_ptr[ridx] = dv;
                }
            };
        }

        ++iter;
        ++ridx;

        if (xlo < xhi && this_x > xhi)
            break;

        if (ridx >= ridx_max)
            break;
    }

    return ridx;
}

// Python API: Take a list of Numpy arrays and a row iterator of
// data and copy+convert the data to ChartDirector friendly format
// stored in the array columns, optionally binning to reduce amount.
template <typename ITER_T>
PyObject*
iter_into_numpy_arrays(PyObject* py_iterable,
                       ITER_T& iter,
                       t_float64 xlimit,
                       t_float64 xlo,
                       t_float64 xhi,
                       const t_idxvec& idxs,
                       const t_idxvec& types)
{
    std::vector<void*> out;
    std::vector<PyArrayObject*> arrays;

    t_py_handle py_iter(PyObject_GetIter(py_iterable));
    PyObject* py_item = 0;

    int ridx = 0;
    int ridx_max = -1;
    bool enable_pruning = (xlimit > 0.0 && idxs.size() > 1);

    if (py_iter.get())
    {
        while ((py_item = PyIter_Next(py_iter.get())) != NULL)
        {
            if (PyArray_Check(py_item) &&
                PyArray_CHKFLAGS(
                    reinterpret_cast<PyArrayObject*>(py_item),
                    NPY_ARRAY_C_CONTIGUOUS))
            {
                arrays.push_back(
                    reinterpret_cast<PyArrayObject*>(py_item));
                out.push_back(PyArray_DATA(arrays.back()));
                size_t nd = static_cast<size_t>(
                    PyArray_DIM(arrays.back(), 0));
                ridx_max = (ridx_max < 0)
                               ? nd
                               : std::min<int>(ridx_max,
                                               static_cast<int>(nd));
            }
            else
            {
                Py_DECREF(py_item);
                PyErr_Format(PyExc_ValueError,
                             "context_into_numpy_arrays: "
                             "Expected contiguous input "
                             "arrays.");
                return NULL;
            }
            Py_DECREF(py_item);
        }
    }

    if (PyErr_Occurred())
    {
        // let propagate error upwards - not expected
        return NULL;
    }

    if (idxs.size() != out.size())
    {
        PyErr_Format(PyExc_ValueError,
                     "context_into_numpy_arrays: Bad input arrays.");
        return NULL;
    }

    // a few checks to make sure output array type matches perspective
    // column
    // type
    for (size_t aidx = 0; aidx < idxs.size(); aidx++)
    {
        if (enable_pruning && types[aidx] == DTYPE_STR)
        {
            std::cerr << "context_into_numpy_arrays: Pruning is only "
                         "supported "
                         "for exclusively numeric data sorted by x; "
                         "use xlimit "
                         "= 0."
                      << std::endl;
            enable_pruning = false;
            break;
        }
    }

    if (enable_pruning)
    {
        ridx = _iter_into_numpy_arrays_binned(
            iter, out, ridx, ridx_max, xlimit, xlo, xhi, idxs, types);
    }
    else
    {
        ridx = _iter_into_numpy_arrays_simple(
            iter, out, ridx, ridx_max, xlo, xhi, idxs, types);
    }

    if (ridx < 0)
    {
        // Python error must have already been set by a sub-function
        return NULL;
    }
    else
    {
        return PyInt_FromSsize_t(ridx);
    }
}

PyObject*
context_minmax_idx_0s(t_ctx0* ctx,
                      t_index column_idx,
                      t_uindex column_type)
{
    size_t cidx = static_cast<size_t>(column_idx);
    std::vector<t_minmax> mmv = ctx->get_min_max();

    if (cidx < mmv.size())
    {
        t_tscalar sv_min = mmv[cidx].m_min;
        t_tscalar sv_max = mmv[cidx].m_max;
        t_float64 d_min =
            scalar_to_chartdir_double(sv_min, column_type);
        t_float64 d_max =
            scalar_to_chartdir_double(sv_max, column_type);

        return Py_BuildValue("dd", d_min, d_max);
    }

    Py_INCREF(Py_None);
    return Py_None;
}

PyObject*
context_into_numpy_arrays_0s(PyObject* py_iterable,
                             t_ctx0* ctx,
                             t_float64 xlimit,
                             const t_idxvec& idxs,
                             const t_idxvec& types,
                             t_float64 xlo,
                             t_float64 xhi)
{
    typedef t_leaf_data_iter<t_ctx0> iter_t;

    t_index from_row = 0;
    t_tscalvec partial(idxs[0] + 1);

    if (xlo <= xhi)
    {
        // presumes that the context is sorted on the idxs[0]:th
        // column
        partial[idxs[0]].set(chartdir_time_to_scalar(xlo));
        from_row = ctx->lower_bound(partial);
    }

    iter_t iter = ctx->iter_data(idxs, from_row);

    return iter_into_numpy_arrays<iter_t>(
        py_iterable, iter, xlimit, xlo, xhi, idxs, types);
}

PyObject*
context_into_numpy_arrays_1s(PyObject* py_iterable,
                             t_ctx1* ctx,
                             t_uindex rlevel,
                             const t_idxvec& idxs,
                             const t_idxvec& types)
{
    typedef t_leaf_data_iter<t_ctx1> iter_t;

    iter_t iter = ctx->iter_leaf_data(idxs, rlevel);

    return iter_into_numpy_arrays<iter_t>(
        py_iterable,
        iter,
        0.0, // not supported for one-sided as they cannot be sorted
             // by leaf
             // nodes
        1.0, // not supported for one-sided as they cannot be sorted
             // by leaf
             // nodes
        0.0, // not supported for one-sided as they cannot be sorted
             // by leaf
             // nodes
        idxs,
        types);
}

PyObject*
context_into_numpy_arrays_2s(PyObject* py_iterable,
                             t_ctx2* ctx,
                             t_uindex rlevel,
                             t_uindex clevel,
                             const t_idxvec& idxs,
                             const t_idxvec& types)
{
    typedef t_leaf_data_iter<t_ctx2> iter_t;

    iter_t iter = ctx->iter_leaf_data(idxs, rlevel, clevel);

    while (iter.valid())
    {
        ++iter;
    }

    return iter_into_numpy_arrays<iter_t>(
        py_iterable,
        iter,
        0.0, // not supported for two-sided as they cannot be sorted
             // by leaf
             // nodes
        1.0, // not supported for two-sided as they cannot be sorted
             // by leaf
             // nodes
        0.0, // not supported for two-sided as they cannot be sorted
             // by leaf
             // nodes
        idxs,
        types);
}

#endif

t_leaf_data_iter<t_ctx0>::t_leaf_data_iter(t_ftrav_csptr traversal,
                                           t_gstate_csptr ds,
                                           const t_idxvec& idx_map,
                                           t_uindex start_row_idx)
    : m_current_row_idx(start_row_idx), m_traversal(traversal),
      m_ds(ds), m_idx_map(idx_map)
{
    m_current_row.resize(m_idx_map.size());
    increment();
}

t_leaf_data_iter<t_ctx0>& t_leaf_data_iter<t_ctx0>::operator++()
{
    increment();
    return *this;
}

void
t_leaf_data_iter<t_ctx0>::fetch_row(t_uindex row_idx)
{
    t_tscalar pkey = m_traversal->get_pkey(row_idx);

    m_current_row_raw = m_ds->get_row(pkey);

    for (size_t ii = 0; ii < m_idx_map.size(); ii++)
    {
        m_current_row[ii] = m_current_row_raw[m_idx_map[ii]];
    }
}

void
t_leaf_data_iter<t_ctx0>::increment()
{
    m_valid = true;

    if (m_current_row_idx < m_traversal->size())
    {
        fetch_row(m_current_row_idx);
        ++m_current_row_idx;
    }
    else
    {
        m_valid = false;
    }
}

t_leaf_data_iter<t_ctx1>::t_leaf_data_iter(t_stree_csptr tree,
                                           const t_idxvec& idx_map,
                                           t_depth row_depth)
    : m_tree(tree), m_idx_map(idx_map), m_row_depth(row_depth),
      m_last_depth(-1)
{
    m_current_row.resize(m_idx_map.size() + 1);
    m_dft.push_front(tree->get_node(0));
    increment();
}

t_leaf_data_iter<t_ctx1>& t_leaf_data_iter<t_ctx1>::operator++()
{
    increment();
    return *this;
}

void
t_leaf_data_iter<t_ctx1>::increment()
{
    std::vector<t_str> plabels;
    m_valid = true;

    while (!m_dft.empty())
    {
        t_stnode node = m_dft.front();
        m_dft.pop_front();

        t_str value = node.m_value.to_string();

        if (node.m_depth < m_row_depth)
        {
            while (node.m_depth < m_last_depth &&
                   m_last_depth != t_depth(-1))
            {
                plabels.pop_back();
                m_last_depth--;
            }

            if (node.m_depth != 0)
                plabels.push_back(value);

            t_stnode_vec nodes;
            m_tree->get_child_nodes(node.m_idx, nodes);
            std::copy(nodes.rbegin(),
                      nodes.rend(),
                      std::front_inserter(m_dft));
        }
        else if (node.m_depth == m_row_depth)
        {
            for (size_t ii = 0; ii < m_idx_map.size(); ++ii)
            {
                t_index aggidx = m_idx_map[ii];

                if (aggidx >= 0)
                {
                    m_current_row[ii].set(
                        m_tree->get_aggregate(node.m_idx, aggidx));
                }
                else
                {
                    m_current_row[ii].set(get_interned_tscalar(
                        make_row_label(plabels, value).c_str()));
                }
            }

            m_last_depth = node.m_depth;
            return;
        }
    }

    m_valid = false;
}

t_leaf_data_iter<t_ctx_grouped_pkey>::t_leaf_data_iter(
    t_stree_csptr tree, const t_idxvec& idx_map, t_depth row_depth)
{
    PSP_COMPLAIN_AND_ABORT("Not implemented");
}

t_leaf_data_iter<t_ctx_grouped_pkey>&
    t_leaf_data_iter<t_ctx_grouped_pkey>::operator++()
{
    PSP_COMPLAIN_AND_ABORT("Not implemented");
    return *this;
}

void
t_leaf_data_iter<t_ctx_grouped_pkey>::increment()
{
    PSP_COMPLAIN_AND_ABORT("Not implemented");
}

t_leaf_data_iter<t_ctx2>::t_leaf_data_iter(
    const t_config& config,
    const t_stree_csptr_vec& trees,
    const t_idxvec& idx_map,
    t_depth row_depth,
    t_depth col_depth)
    : m_trees(trees), m_idx_map(idx_map), m_row_depth(row_depth),
      m_col_depth(col_depth), m_last_depth(-1)
{
    auto tree = m_trees[m_row_depth];

    m_current_row.resize(m_idx_map.size() + 1);
    m_dft.push_front(tree->get_node(0));

    setup_context_info(config);
    increment();
}

t_leaf_data_iter<t_ctx2>& t_leaf_data_iter<t_ctx2>::operator++()
{
    increment();
    return *this;
}

void
t_leaf_data_iter<t_ctx2>::setup_context_info(const t_config& config)
{
    m_n_aggs = config.get_num_aggregates();
    m_n_cols = m_trees.front()->get_num_leaves(m_col_depth);
    m_col_paths.reserve(m_n_cols);
    t_idxvec cidxvec = m_trees[0]->get_indices_for_depth(m_col_depth);

    for (t_uindex cidx = 1; cidx < m_n_cols; ++cidx)
    {
        t_index translated_idx = (cidx - 1) / m_n_aggs;
        t_ptidx c_ptidx = cidxvec[translated_idx];

        m_col_paths[cidx - 1].reserve(config.get_num_cpivots());
        m_trees[0]->get_path(c_ptidx, m_col_paths[cidx - 1]);
    }

    m_r_path.reserve(config.get_num_rpivots() +
                     config.get_num_cpivots() + 1);

    m_empty_cell_value.set("");
}

void
t_leaf_data_iter<t_ctx2>::increment()
{
    auto tree = m_trees[m_row_depth];
    std::vector<t_str> plabels;

    while (!m_dft.empty())
    {
        t_stnode node = m_dft.front();
        m_dft.pop_front();

        t_str value = node.m_value.to_string();

        if (node.m_depth < m_row_depth)
        {
            while (node.m_depth < m_last_depth &&
                   m_last_depth != t_depth(-1))
            {
                plabels.pop_back();
                m_last_depth--;
            }

            if (node.m_depth != 0)
                plabels.push_back(value);

            t_stnode_vec nodes;
            tree->get_child_nodes(node.m_idx, nodes);
            std::copy(nodes.rbegin(),
                      nodes.rend(),
                      std::front_inserter(m_dft));
        }
        else if (node.m_depth == m_row_depth)
        {
            t_ptidx r_ptidx = node.m_idx;
            tree->get_path(r_ptidx, m_r_path);
            t_depth r_depth = node.m_depth;

            for (size_t ii = 0; ii < m_idx_map.size(); ++ii)
            {
                t_index cidx = m_idx_map[ii];
                t_index translated_cidx = cidx - 1;

                const t_tscalvec& c_path =
                    m_col_paths[translated_cidx];

                t_index agg_idx = translated_cidx % m_n_aggs;
                t_ptidx query_ptidx = INVALID_INDEX;

                if (cidx <= 0)
                {
                    m_current_row[ii].set(get_interned_tscalar(
                        make_row_label(plabels, value).c_str()));
                }
                else
                {
                    if (c_path.size() == 0)
                    {
                        query_ptidx = r_ptidx;
                    }
                    else
                    {
                        if (r_depth + 1 ==
                            static_cast<t_depth>(m_trees.size()))
                        {
                            query_ptidx =
                                tree->resolve_path(r_ptidx, c_path);
                        }
                        else
                        {
                            t_ptidx path_ptidx =
                                tree->resolve_path(0, m_r_path);
                            query_ptidx =
                                (path_ptidx < 0)
                                    ? INVALID_INDEX
                                    : tree->resolve_path(path_ptidx,
                                                         c_path);
                        }
                    }

                    if (query_ptidx < 0)
                    {
                        m_current_row[ii].set(m_empty_cell_value);
                    }
                    else
                    {
                        m_current_row[ii].set(tree->get_aggregate(
                            query_ptidx, agg_idx));
                    }
                }
            }

            m_r_path.clear();
            m_last_depth = node.m_depth;
            return;
        }
    }

    m_valid = false;
}

} // end namespace perspective
