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
