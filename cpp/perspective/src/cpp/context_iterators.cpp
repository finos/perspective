/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/sort_specification.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/extract_aggregate.h>
#include <perspective/raii.h>
#include <perspective/sparse_tree.h>

namespace perspective {

t_trav_iter_node::t_trav_iter_node(const t_tscalar& value, bool expanded,
    t_depth depth, t_index ndesc, t_index tnid, t_index ridx, t_index pridx)
    : value(value)
    , expanded(expanded)
    , depth(depth)
    , ndesc(ndesc)
    , tree_handle(tnid)
    , idx(ridx)
    , pidx(pridx) {}

t_ctx2_trav_seq_iter::t_ctx2_trav_seq_iter(t_ctx2* ctx, t_header header)
    : m_ctx(ctx)
    , m_header(header)
    , m_curidx(0) {
    m_nrows = ctx->get_row_count(header);
}

t_leaf_iter_node::t_leaf_iter_node(const t_tscalar& value, bool expanded,
    t_depth depth, t_index ndesc, t_index tnid, t_index ridx, t_index pridx,
    t_index nleaves)
    : value(value)
    , expanded(expanded)
    , depth(depth)
    , ndesc(ndesc)
    , tree_handle(tnid)
    , idx(ridx)
    , pidx(pridx)
    , nleaves(nleaves) {}

bool
t_ctx2_trav_seq_iter::has_next() const {
    return m_curidx < m_nrows;
}

t_trav_iter_node*
t_ctx2_trav_seq_iter::next() {
    auto node = m_ctx->get_trav_node(m_header, m_curidx);
    auto iter_node
        = new t_trav_iter_node(m_ctx->get_tree_value(m_header, node.m_tnid),
            node.m_expanded, node.m_depth, node.m_ndesc, node.m_tnid, m_curidx,
            m_curidx - node.m_rel_pidx);

    m_curidx += 1;
    return iter_node;
}

t_ctx2_leaf_iter::t_ctx2_leaf_iter(const t_ctx2* ctx, t_header header)
    : m_ctx(ctx)
    , m_header(header)
    , m_curidx(0) {
    m_nrows = ctx->get_row_count(header);
}

bool
t_ctx2_leaf_iter::has_next() const {
    return m_curidx < m_nrows;
}

t_leaf_iter_node*
t_ctx2_leaf_iter::next() {
    auto node = m_ctx->get_trav_node(m_header, m_curidx);
    t_index nleaves = m_ctx->get_trav_num_tree_leaves(m_header, m_curidx);

    t_leaf_iter_node* iter_node
        = new t_leaf_iter_node(m_ctx->get_tree_value(m_header, node.m_tnid),
            node.m_expanded, node.m_depth, node.m_ndesc, node.m_tnid, m_curidx,
            m_curidx - node.m_rel_pidx, nleaves);

    m_curidx += 1;
    return iter_node;
}

t_ctx1_tree_iter::t_ctx1_tree_iter(t_ctx1* ctx, t_index root, t_depth depth)
    : m_curidx(0)
    , m_ctx(ctx) {
    m_agg_indices = std::vector<t_index>(ctx->get_aggregates().size());

    for (t_uindex idx = 0, loop_end = m_agg_indices.size(); idx < loop_end;
         ++idx) {
        m_agg_indices[idx] = idx;
    }

    m_has_next = !(m_agg_indices.empty());
    if (m_has_next) {
        t_depth rdepth = ctx->get_trav_depth(root);
        m_edepth = rdepth + depth;
        m_edepth = std::min(m_edepth, ctx->get_num_levels() - 1);
        m_vec = m_ctx->get_flattened_tree(root, m_edepth);
        if (m_vec.size() == 1 && m_vec[0].m_nchild == 0) {
            m_has_next = false;
        }

        m_aggcols = ctx->_get_tree()->get_aggcols(m_agg_indices);
    }
}

t_ctx1_tree_iter::t_ctx1_tree_iter(t_ctx1* ctx, t_index root, t_depth depth,
    const std::vector<t_index>& aggregates)
    : m_curidx(0)
    , m_ctx(ctx)
    , m_agg_indices(aggregates) {
    m_has_next = !(m_agg_indices.empty());
    if (m_has_next) {
        t_depth rdepth = ctx->get_trav_depth(root);
        m_edepth = rdepth + depth;
        m_edepth = std::min(m_edepth, ctx->get_num_levels() - 1);
        m_vec = m_ctx->get_flattened_tree(root, m_edepth);
        if (m_vec.size() == 1 && m_vec[0].m_nchild == 0) {
            m_has_next = false;
        }

        m_aggcols = ctx->_get_tree()->get_aggcols(aggregates);
    }
}

bool
t_ctx1_tree_iter::has_next() const {
    return m_has_next;
}

PyObject*
t_ctx1_tree_iter::next() {
    t_ftreenode& ftnode = m_vec[m_curidx];
    t_index bidx;
    t_index nrows;
    if (m_ctx->get_row_pivots().size() == 0 || m_edepth == 0) {
        bidx = 0;
        nrows = 1;
    } else {
        bidx = ftnode.m_fcidx;
        nrows = ftnode.m_nchild;
    }
    npy_intp dims[] = {static_cast<npy_intp>(nrows)};
    t_py_handle dtype(
        Py_BuildValue("[(s, s), (s, s)]", "id", "i4", "field_label", "O"));
    t_index n_aggs = m_agg_indices.size();

    for (int i = 0; i < n_aggs; i++) {
        std::stringstream field_name;
        field_name << "field_" << i + 1;
        t_py_handle d_field(
            Py_BuildValue("(s,s)", field_name.str().c_str(), "f8"));
        PyList_Append(dtype.m_pyo, d_field.m_pyo);
    }
    PyArray_Descr* descr;
    PyArray_DescrConverter(dtype.m_pyo, &descr);
    t_py_handle array(PyArray_SimpleNewFromDescr(1, dims, descr));
    PyArrayObject* array_ = reinterpret_cast<PyArrayObject*>(array.m_pyo);

    t_stree* tree = m_ctx->_get_tree();
    const std::vector<t_aggspec>& aggspecs
        = m_ctx->get_config().get_aggregates();

    for (int i = 0; i < nrows; i++) {
        t_ftreenode& c_ftnode = m_vec[bidx + i];
        t_index cidx = c_ftnode.m_idx;
        void* elem_ptr = PyArray_GETPTR1(array_, i);
        t_py_handle val(PyTuple_New(n_aggs + 2));
        PyTuple_SetItem(val.m_pyo, 0, PyInt_FromLong(cidx));

        t_tscalar tree_value = m_ctx->get_tree_value(cidx);
        PyObject* py_tree_value = tscalar_to_python(tree_value);
        PyTuple_SetItem(val.m_pyo, 1, py_tree_value);

        t_index p_cidx = tree->get_parent_idx(cidx);

        t_uindex agg_ridx = tree->get_aggidx(cidx);
        t_index agg_pridx = p_cidx == INVALID_INDEX ? INVALID_INDEX
                                                    : tree->get_aggidx(p_cidx);

        for (int j = 0; j < n_aggs; j++) {
            t_tscalar agg_scalar = extract_aggregate(
                aggspecs[j], m_aggcols[j], agg_ridx, agg_pridx);
            double aggdbl = agg_scalar.to_double();
            PyTuple_SetItem(val.m_pyo, j + 2, PyFloat_FromDouble(aggdbl));
        }
        PyArray_SETITEM(array_, static_cast<char*>(elem_ptr), val.m_pyo);
    }
    long is_leaf = ftnode.m_depth + 1 == m_edepth;
    PyObject* rval = Py_BuildValue("OO", PyBool_FromLong(is_leaf), array.m_pyo);
    m_curidx++;

    if (m_vec[m_curidx].m_depth == t_depth(-1)
        || m_ctx->get_row_pivots().size() == 0 || m_edepth == 0
        || static_cast<std::uint64_t>(m_curidx) >= m_vec.size()) {
        m_has_next = false;
    }
    return rval;
}

} // end namespace perspective
