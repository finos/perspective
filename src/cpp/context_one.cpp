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
#include <perspective/context_common.h>
#include <perspective/context_one.h>
#include <perspective/extract_aggregate.h>
#include <perspective/filter.h>
#include <perspective/sparse_tree.h>
#include <perspective/tree_context_common.h>
#include <perspective/logtime.h>
#include <perspective/env_vars.h>
#include <perspective/traversal.h>

namespace perspective {

t_ctx1::t_ctx1(const t_schema& schema, const t_config& pivot_config)
    : t_ctxbase<t_ctx1>(schema, pivot_config)
    , m_depth_set(false)
    , m_depth(0) {}

t_ctx1::~t_ctx1() {}

void
t_ctx1::init() {
    auto pivots = m_config.get_row_pivots();
    m_tree = std::make_shared<t_stree>(pivots, m_config.get_aggregates(), m_schema, m_config);
    m_tree->init();
    m_traversal
        = std::shared_ptr<t_traversal>(new t_traversal(m_tree, m_config.handle_nan_sort()));
    m_minmax = t_minmaxvec(m_config.get_num_aggregates());
    m_init = true;
}

t_index
t_ctx1::get_row_count() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_traversal->size();
}

t_index
t_ctx1::get_column_count() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_config.get_num_aggregates() + 1;
}

t_index
t_ctx1::open(t_header header, t_tvidx idx) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return open(idx);
}

t_str
t_ctx1::repr() const {
    std::stringstream ss;
    ss << "t_ctx1<" << this << ">";
    return ss.str();
}

t_index
t_ctx1::open(t_tvidx idx) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    // If we manually open/close a node, stop automatically expanding
    m_depth_set = false;
    m_depth = 0;

    if (idx >= t_tvidx(m_traversal->size()))
        return 0;

    t_index retval = m_traversal->expand_node(m_sortby, idx);
    m_rows_changed = (retval > 0);
    return retval;
}

t_index
t_ctx1::close(t_tvidx idx) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    // If we manually open/close a node, stop automatically expanding
    m_depth_set = false;
    m_depth = 0;

    if (idx >= t_tvidx(m_traversal->size()))
        return 0;

    t_index retval = m_traversal->collapse_node(idx);
    m_rows_changed = (retval > 0);
    return retval;
}

t_tscalvec
t_ctx1::get_data(t_tvidx start_row, t_tvidx end_row, t_tvidx start_col, t_tvidx end_col) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    auto ext = sanitize_get_data_extents(*this, start_row, end_row, start_col, end_col);

    t_index nrows = ext.m_erow - ext.m_srow;
    t_index stride = ext.m_ecol - ext.m_scol;

    t_uindex ncols = get_column_count();
    t_tscalvec tmpvalues(nrows * ncols);
    t_tscalvec values(nrows * stride);

    t_colcptrvec aggcols(m_config.get_num_aggregates());

    auto aggtable = m_tree->get_aggtable();
    t_schema aggschema = aggtable->get_schema();
    auto none = mknone();

    for (t_uindex aggidx = 0, loop_end = aggcols.size(); aggidx < loop_end; ++aggidx) {
        const t_str& aggname = aggschema.m_columns[aggidx];
        aggcols[aggidx] = aggtable->get_const_column(aggname).get();
    }

    const t_aggspecvec& aggspecs = m_config.get_aggregates();

    for (t_index ridx = ext.m_srow; ridx < ext.m_erow; ++ridx) {
        t_ptidx nidx = m_traversal->get_tree_index(ridx);
        t_ptidx pnidx = m_tree->get_parent_idx(nidx);

        t_uindex agg_ridx = m_tree->get_aggidx(nidx);
        t_index agg_pridx = pnidx == INVALID_INDEX ? INVALID_INDEX : m_tree->get_aggidx(pnidx);

        t_tscalar tree_value = m_tree->get_value(nidx);
        tmpvalues[(ridx - ext.m_srow) * ncols] = tree_value;

        for (t_index aggidx = 0, loop_end = aggcols.size(); aggidx < loop_end; ++aggidx) {
            t_tscalar value
                = extract_aggregate(aggspecs[aggidx], aggcols[aggidx], agg_ridx, agg_pridx);
            if (!value.is_valid())
                value.set(none); // todo: fix null handling
            tmpvalues[(ridx - ext.m_srow) * ncols + 1 + aggidx].set(value);
        }
    }

    for (auto ridx = ext.m_srow; ridx < ext.m_erow; ++ridx) {
        for (auto cidx = ext.m_scol; cidx < ext.m_ecol; ++cidx) {
            auto insert_idx = (ridx - ext.m_srow) * stride + cidx - ext.m_scol;
            auto src_idx = (ridx - ext.m_srow) * ncols + cidx;
            values[insert_idx].set(tmpvalues[src_idx]);
        }
    }
    return values;
}

void
t_ctx1::notify(const t_table& flattened, const t_table& delta, const t_table& prev,
    const t_table& current, const t_table& transitions, const t_table& existed) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    psp_log_time(repr() + " notify.enter");
    notify_sparse_tree(m_tree, m_traversal, true, m_config.get_aggregates(),
        m_config.get_sortby_pairs(), m_sortby, flattened, delta, prev, current, transitions,
        existed, m_config, *m_state);
    psp_log_time(repr() + " notify.exit");
}

void
t_ctx1::step_begin() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    reset_step_state();
}

void
t_ctx1::step_end() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_minmax = m_tree->get_min_max();
    sort_by(m_sortby);
    if (m_depth_set) {
        set_depth(m_depth);
    }
}

t_aggspec
t_ctx1::get_aggregate(t_uindex idx) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    if (idx >= m_config.get_num_aggregates())
        return t_aggspec();
    return m_config.get_aggregates()[idx];
}

t_aggspecvec
t_ctx1::get_aggregates() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_config.get_aggregates();
}

t_tscalvec
t_ctx1::get_row_path(t_tvidx idx) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    if (idx < 0)
        return t_tscalvec();
    return ctx_get_path(m_tree, m_traversal, idx);
}

void
t_ctx1::reset_sortby() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_sortby = t_sortsvec();
}

void
t_ctx1::sort_by(const t_sortsvec& sortby) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_sortby = sortby;
    if (m_sortby.empty()) {
        return;
    }
    m_traversal->sort_by(m_config, sortby, *(m_tree.get()));
}

void
t_ctx1::set_depth(t_depth depth) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    if (m_config.get_num_rpivots() == 0)
        return;
    depth = std::min<t_depth>(m_config.get_num_rpivots() - 1, depth);
    t_index retval = 0;
    retval = m_traversal->set_depth(m_sortby, depth);
    m_rows_changed = (retval > 0);
    m_depth = depth;
    m_depth_set = true;
}

t_tscalvec
t_ctx1::get_pkeys(const t_uidxpvec& cells) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    if (!m_traversal->validate_cells(cells)) {
        t_tscalvec rval;
        return rval;
    }

    t_tscalvec rval;
    t_ptivec tindices(cells.size());
    for (const auto& c : cells) {
        auto ptidx = m_traversal->get_tree_index(c.first);
        auto pkeys = m_tree->get_pkeys(ptidx);

        rval.insert(std::end(rval), std::begin(pkeys), std::end(pkeys));
    }
    return rval;
}

t_tscalvec
t_ctx1::get_cell_data(const t_uidxpvec& cells) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    if (!m_traversal->validate_cells(cells)) {
        t_tscalvec rval;
        return rval;
    }

    t_tscalvec rval(cells.size());
    t_tscalar empty = mknone();

    auto aggtable = m_tree->get_aggtable();
    auto aggcols = aggtable->get_const_columns();
    const t_aggspecvec& aggspecs = m_config.get_aggregates();

    for (t_index idx = 0, loop_end = cells.size(); idx < loop_end; ++idx) {
        const auto& cell = cells[idx];
        if (cell.second == 0) {
            rval[idx].set(empty);
            continue;
        }

        t_ptidx rptidx = m_traversal->get_tree_index(cell.first);
        t_uindex aggidx = cell.second - 1;

        t_ptidx p_rptidx = m_tree->get_parent_idx(rptidx);
        t_uindex agg_ridx = m_tree->get_aggidx(rptidx);
        t_index agg_pridx
            = p_rptidx == INVALID_INDEX ? INVALID_INDEX : m_tree->get_aggidx(p_rptidx);

        rval[idx] = extract_aggregate(aggspecs[aggidx], aggcols[aggidx], agg_ridx, agg_pridx);
    }

    return rval;
}

void
t_ctx1::set_feature_state(t_ctx_feature feature, t_bool state) {
    m_features[feature] = state;
}

void
t_ctx1::set_alerts_enabled(bool enabled_state) {
    m_features[CTX_FEAT_ALERT] = enabled_state;
    m_tree->set_alerts_enabled(enabled_state);
}

void
t_ctx1::set_deltas_enabled(bool enabled_state) {
    m_features[CTX_FEAT_DELTA] = enabled_state;
    m_tree->set_deltas_enabled(enabled_state);
}

void
t_ctx1::set_minmax_enabled(bool enabled_state) {
    m_features[CTX_FEAT_MINMAX] = enabled_state;
    m_tree->set_minmax_enabled(enabled_state);
}

t_minmaxvec
t_ctx1::get_min_max() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_minmax;
}

t_stepdelta
t_ctx1::get_step_delta(t_tvidx bidx, t_tvidx eidx) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    bidx = std::min(bidx, t_tvidx(m_traversal->size()));
    eidx = std::min(eidx, t_tvidx(m_traversal->size()));

    t_stepdelta rval(m_rows_changed, m_columns_changed, get_cell_delta(bidx, eidx));
    m_tree->clear_deltas();
    return rval;
}

t_cellupdvec
t_ctx1::get_cell_delta(t_tvidx bidx, t_tvidx eidx) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    eidx = std::min(eidx, t_tvidx(m_traversal->size()));
    t_cellupdvec rval;
    const auto& deltas = m_tree->get_deltas();
    for (t_tvidx idx = bidx; idx < eidx; ++idx) {
        t_ptidx ptidx = m_traversal->get_tree_index(idx);
        auto iterators = deltas->get<by_tc_nidx_aggidx>().equal_range(ptidx);
        for (auto iter = iterators.first; iter != iterators.second; ++iter) {
            rval.push_back(
                t_cellupd(idx, iter->m_aggidx + 1, iter->m_old_value, iter->m_new_value));
        }
    }
    return rval;
}

void
t_ctx1::reset() {
    auto pivots = m_config.get_row_pivots();
    m_tree = std::make_shared<t_stree>(pivots, m_config.get_aggregates(), m_schema, m_config);
    m_tree->init();
    m_tree->set_deltas_enabled(get_feature_state(CTX_FEAT_DELTA));
    m_traversal
        = std::shared_ptr<t_traversal>(new t_traversal(m_tree, m_config.handle_nan_sort()));
}

void
t_ctx1::reset_step_state() {
    m_rows_changed = false;
    m_columns_changed = false;
    if (t_env::log_progress()) {
        std::cout << "t_ctx1.reset_step_state " << repr() << std::endl;
    }
}

t_index
t_ctx1::sidedness() const {
    return 1;
}

t_streeptr_vec
t_ctx1::get_trees() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_streeptr_vec rval(1);
    rval[0] = m_tree.get();
    return rval;
}

t_bool
t_ctx1::has_deltas() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_tree->has_deltas();
}

t_minmax
t_ctx1::get_agg_min_max(t_uindex aggidx, t_depth depth) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_tree->get_agg_min_max(aggidx, depth);
}

void
t_ctx1::notify(const t_table& flattened) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    notify_sparse_tree(m_tree, m_traversal, true, m_config.get_aggregates(),
        m_config.get_sortby_pairs(), m_sortby, flattened, m_config, *m_state);
}

void
t_ctx1::pprint() const {
    std::cout << "\t" << std::endl;
    for (auto idx = 1; idx < get_column_count(); ++idx) {
        std::cout << get_aggregate(idx - 1).agg_str() << ", " << std::endl;
    }

    t_colcptrvec aggcols(m_config.get_num_aggregates());
    auto aggtable = m_tree->get_aggtable();
    t_schema aggschema = aggtable->get_schema();
    auto none = mknone();

    for (t_uindex aggidx = 0, loop_end = aggcols.size(); aggidx < loop_end; ++aggidx) {
        const t_str& aggname = aggschema.m_columns[aggidx];
        aggcols[aggidx] = aggtable->get_const_column(aggname).get();
    }

    const t_aggspecvec& aggspecs = m_config.get_aggregates();

    for (auto ridx = 0; ridx < get_row_count(); ++ridx) {
        t_ptidx nidx = m_traversal->get_tree_index(ridx);
        t_ptidx pnidx = m_tree->get_parent_idx(nidx);

        t_uindex agg_ridx = m_tree->get_aggidx(nidx);
        t_index agg_pridx = pnidx == INVALID_INDEX ? INVALID_INDEX : m_tree->get_aggidx(pnidx);

        std::cout << get_row_path(ridx) << " => ";
        for (t_index aggidx = 0, loop_end = aggcols.size(); aggidx < loop_end; ++aggidx) {
            t_tscalar value
                = extract_aggregate(aggspecs[aggidx], aggcols[aggidx], agg_ridx, agg_pridx);
            if (!value.is_valid())
                value.set(none); // todo: fix null handling

            std::cout << value << ", ";
        }

        std::cout << "\n";
    }

    std::cout << "=================" << std::endl;
}

t_index
t_ctx1::get_row_idx(const t_tscalvec& path) const {
    auto nidx = m_tree->resolve_path(0, path);
    if (nidx == INVALID_INDEX) {
        return nidx;
    }

    return m_traversal->get_traversal_index(nidx);
}

t_dtype
t_ctx1::get_column_dtype(t_uindex idx) const {
    if (idx == 0 || idx >= static_cast<t_uindex>(get_column_count()))
        return DTYPE_NONE;
    return m_tree->get_aggtable()->get_const_column(idx - 1)->get_dtype();
}

t_depth
t_ctx1::get_trav_depth(t_tvidx idx) const {
    return m_traversal->get_depth(idx);
}

t_tscalvec
t_ctx1::unity_get_row_data(t_uindex idx) const {
    auto rval = get_data(idx, idx + 1, 0, get_column_count());
    if (rval.empty())
        return t_tscalvec();

    return t_tscalvec(rval.begin() + 1, rval.end());
}

t_tscalvec
t_ctx1::unity_get_column_data(t_uindex idx) const {
    PSP_COMPLAIN_AND_ABORT("Not implemented");
    return t_tscalvec();
}

t_tscalvec
t_ctx1::unity_get_row_path(t_uindex idx) const {
    return get_row_path(idx);
}

t_tscalvec
t_ctx1::unity_get_column_path(t_uindex idx) const {
    return t_tscalvec();
}

t_uindex
t_ctx1::unity_get_row_depth(t_uindex ridx) const {
    return m_traversal->get_depth(ridx);
}

t_uindex
t_ctx1::unity_get_column_depth(t_uindex cidx) const {
    return 0;
}

t_str
t_ctx1::unity_get_column_name(t_uindex idx) const {
    return m_config.unity_get_column_name(idx);
}

t_str
t_ctx1::unity_get_column_display_name(t_uindex idx) const {
    return m_config.unity_get_column_display_name(idx);
}

t_svec
t_ctx1::unity_get_column_names() const {
    t_svec rv;

    for (t_uindex idx = 0, loop_end = unity_get_column_count(); idx < loop_end; ++idx) {
        rv.push_back(unity_get_column_name(idx));
    }
    return rv;
}

t_svec
t_ctx1::unity_get_column_display_names() const {
    t_svec rv;

    for (t_uindex idx = 0, loop_end = unity_get_column_count(); idx < loop_end; ++idx) {
        rv.push_back(unity_get_column_display_name(idx));
    }
    return rv;
}

t_uindex
t_ctx1::unity_get_column_count() const {
    return get_column_count() - 1;
}

t_uindex
t_ctx1::unity_get_row_count() const {
    return get_row_count();
}

t_bool
t_ctx1::unity_get_row_expanded(t_uindex idx) const {
    return m_traversal->get_node_expanded(idx);
}

t_bool
t_ctx1::unity_get_column_expanded(t_uindex idx) const {
    return false;
}

void
t_ctx1::clear_deltas() {
    m_tree->clear_deltas();
}

void
t_ctx1::unity_init_load_step_end() {}

} // end namespace perspective
