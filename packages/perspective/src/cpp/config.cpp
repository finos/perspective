/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/config.h>

namespace perspective {

t_config_recipe::t_config_recipe()
    : m_child_pkey_column("psp_pkey") {}

t_config::t_config() {}

t_config::t_config(const t_config_recipe& r)
    : m_detail_columns(r.m_detail_columns)
    , m_totals(r.m_totals)
    , m_combiner(r.m_combiner)
    , m_handle_nan_sort(r.m_handle_nan_sort)
    , m_parent_pkey_column(r.m_parent_pkey_column)
    , m_child_pkey_column(r.m_child_pkey_column)
    , m_grouping_label_column(r.m_grouping_label_column)
    , m_fmode(r.m_fmode)
    , m_filter_exprs(r.m_filter_exprs)

{
    for (const auto& v : r.m_row_pivots) {
        m_row_pivots.push_back(t_pivot(v));
    }

    for (const auto& v : r.m_col_pivots) {
        m_col_pivots.push_back(t_pivot(v));
    }

    for (const auto& v : r.m_aggregates) {
        m_aggregates.push_back(t_aggspec(v));
    }

    if (m_fmode == FMODE_SIMPLE_CLAUSES) {
        for (const auto& v : r.m_fterms) {
            m_fterms.push_back(t_fterm(v));
        }
    }

    t_svec sort_pivot;
    t_svec sort_pivot_by;

    for (const auto& v : r.m_sortby) {
        sort_pivot.push_back(v.first);
        sort_pivot_by.push_back(v.second);
    }

    setup(m_detail_columns, sort_pivot, sort_pivot_by);
}

t_config::t_config(const t_pivotvec& row_pivots, const t_pivotvec& col_pivots,
    const t_aggspecvec& aggregates, const t_svec& detail_columns, const t_totals totals,
    const t_svec& sort_pivot, const t_svec& sort_pivot_by, t_filter_op combiner,
    const t_ftermvec& fterms, t_bool handle_nan_sort, const t_str& parent_pkey_column,
    const t_str& child_pkey_column, const t_str& grouping_label_column, t_fmode fmode,
    const t_svec& filter_exprs, const t_str& grand_agg_str)
    : m_row_pivots(row_pivots)
    , m_col_pivots(col_pivots)
    , m_aggregates(aggregates)
    , m_detail_columns(detail_columns)
    , m_totals(totals)
    , m_combiner(combiner)
    , m_fterms(fterms)
    , m_handle_nan_sort(handle_nan_sort)
    , m_parent_pkey_column(parent_pkey_column)
    , m_child_pkey_column(child_pkey_column)
    , m_grouping_label_column(grouping_label_column)
    , m_fmode(fmode)
    , m_filter_exprs(filter_exprs)
    , m_grand_agg_str(grand_agg_str) {
    setup(detail_columns, sort_pivot, sort_pivot_by);
}

t_config::t_config(const t_pivotvec& row_pivots, const t_aggspecvec& aggregates)
    : m_row_pivots(row_pivots)
    , m_aggregates(aggregates)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {
    setup(m_detail_columns, t_svec{}, t_svec{});
}

// grouped_pkeys
t_config::t_config(const t_svec& row_pivots, const t_svec& detail_columns, t_filter_op combiner,
    const t_ftermvec& fterms, const t_str& parent_pkey_column, const t_str& child_pkey_column,
    const t_str& grouping_label_column)
    : m_detail_columns(detail_columns)
    , m_combiner(combiner)
    , m_fterms(fterms)
    , m_handle_nan_sort(true)
    , m_parent_pkey_column(parent_pkey_column)
    , m_child_pkey_column(child_pkey_column)
    , m_grouping_label_column(grouping_label_column)
    , m_fmode(FMODE_SIMPLE_CLAUSES)

{
    for (const auto& p : row_pivots) {
        m_row_pivots.push_back(t_pivot(p));
    }

    setup(m_detail_columns, t_svec{}, t_svec{});
}

// ctx2
t_config::t_config(const t_svec& row_pivots, const t_svec& col_pivots,
    const t_aggspecvec& aggregates, const t_totals totals, t_filter_op combiner,
    const t_ftermvec& fterms)
    : m_aggregates(aggregates)
    , m_totals(totals)
    , m_combiner(combiner)
    , m_fterms(fterms)
    , m_handle_nan_sort(true)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {
    for (const auto& p : row_pivots) {
        m_row_pivots.push_back(t_pivot(p));
    }

    for (const auto& p : col_pivots) {
        m_col_pivots.push_back(t_pivot(p));
    }

    setup(m_detail_columns, t_svec{}, t_svec{});
}

// t_ctx1
t_config::t_config(const t_svec& row_pivots, const t_aggspecvec& aggregates)
    : m_aggregates(aggregates)
    , m_totals(TOTALS_BEFORE)
    , m_combiner(FILTER_OP_AND)
    , m_handle_nan_sort(true)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {
    for (const auto& p : row_pivots) {
        m_row_pivots.push_back(t_pivot(p));
    }

    setup(m_detail_columns, t_svec{}, t_svec{});
}

t_config::t_config(const t_svec& row_pivots, const t_aggspecvec& aggregates,
    t_filter_op combiner, const t_ftermvec& fterms)
    : m_aggregates(aggregates)
    , m_totals(TOTALS_BEFORE)
    , m_combiner(combiner)
    , m_fterms(fterms)
    , m_handle_nan_sort(true)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {
    for (const auto& p : row_pivots) {
        m_row_pivots.push_back(t_pivot(p));
    }

    setup(m_detail_columns, t_svec{}, t_svec{});
}

// t_ctx0
t_config::t_config(const t_svec& detail_columns, t_filter_op combiner, const t_ftermvec& fterms)
    : m_detail_columns(detail_columns)
    , m_combiner(combiner)
    , m_fterms(fterms)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {}

void
t_config::setup(
    const t_svec& detail_columns, const t_svec& sort_pivot, const t_svec& sort_pivot_by) {
    t_index count = 0;
    for (t_svec::const_iterator iter = detail_columns.begin(); iter != detail_columns.end();
         ++iter) {
        m_detail_colmap[*iter] = count;
        count++;
    }

    m_has_pkey_agg = false;

    for (t_aggspecvec::const_iterator iter = m_aggregates.begin(); iter != m_aggregates.end();
         ++iter) {
        switch (iter->agg()) {
            case AGGTYPE_AND:
            case AGGTYPE_OR:
            case AGGTYPE_ANY:
            case AGGTYPE_FIRST:
            case AGGTYPE_LAST:
            case AGGTYPE_MEAN:
            case AGGTYPE_WEIGHTED_MEAN:
            case AGGTYPE_UNIQUE:
            case AGGTYPE_MEDIAN:
            case AGGTYPE_JOIN:
            case AGGTYPE_DOMINANT:
            case AGGTYPE_PY_AGG:
            case AGGTYPE_SUM_NOT_NULL:
            case AGGTYPE_SUM_ABS:
            case AGGTYPE_MUL:
            case AGGTYPE_DISTINCT_COUNT:
            case AGGTYPE_DISTINCT_LEAF:
                m_has_pkey_agg = true;
                break;
            default:
                break;
        }

        if (m_has_pkey_agg)
            break;
    }

    for (t_index idx = 0, loop_end = sort_pivot.size(); idx < loop_end; ++idx) {
        m_sortby[sort_pivot[idx]] = sort_pivot_by[idx];
    }

    populate_sortby(m_row_pivots);
    populate_sortby(m_col_pivots);
}

void
t_config::populate_sortby(const t_pivotvec& pivots) {
    for (t_index idx = 0, loop_end = pivots.size(); idx < loop_end; ++idx) {
        const t_pivot& pivot = pivots[idx];

        PSP_VERBOSE_ASSERT(
            pivot.mode() == PIVOT_MODE_NORMAL, "Only normal pivots supported for now");
        t_str pstr = pivot.colname();
        if (m_sortby.find(pstr) == m_sortby.end())
            m_sortby[pstr] = pstr;
    }
}

t_index
t_config::get_colidx(const t_str& colname) const {
    t_sidxmap::const_iterator iter = m_detail_colmap.find(colname);
    if (iter == m_detail_colmap.end()) {
        return INVALID_INDEX;
    } else {
        return iter->second;
    }
}

t_str
t_config::repr() const {
    std::stringstream ss;
    ss << "t_config<" << this << ">";
    return ss.str();
}

t_uindex
t_config::get_num_aggregates() const {
    return m_aggregates.size();
}

t_uindex
t_config::get_num_columns() const {
    return m_detail_columns.size();
}

t_str
t_config::col_at(t_uindex idx) const {
    if (idx >= m_detail_columns.size())
        return "";
    return m_detail_columns[idx];
}

bool
t_config::has_pkey_agg() const {
    return m_has_pkey_agg;
}

t_str
t_config::get_totals_string() const {
    switch (m_totals) {
        case TOTALS_BEFORE: {
            return "before";
        } break;
        case TOTALS_HIDDEN: {
            return "hidden";
        } break;
        case TOTALS_AFTER: {
            return "after";
        } break;
        default: { return "INVALID_TOTALS"; } break;
    }
}

t_str
t_config::get_sort_by(const t_str& pivot) const {
    t_str rval;
    t_ssmap::const_iterator iter = m_sortby.find(pivot);

    if (iter == m_sortby.end()) {
        return pivot;
    } else {
        rval = iter->second;
    }
    return rval;
}

bool
t_config::validate_colidx(t_index idx) const {
    if (idx < 0 || idx >= static_cast<t_index>(get_num_columns()))
        return false;
    return true;
}

t_svec
t_config::get_column_names() const {
    return m_detail_columns;
}

t_uindex
t_config::get_num_rpivots() const {
    return m_row_pivots.size();
}

t_uindex
t_config::get_num_cpivots() const {
    return m_col_pivots.size();
}

const t_pivotvec&
t_config::get_row_pivots() const {
    return m_row_pivots;
}

const t_pivotvec&
t_config::get_column_pivots() const {
    return m_col_pivots;
}

t_sspvec
t_config::get_sortby_pairs() const {
    t_sspvec rval(m_sortby.size());
    t_uindex idx = 0;
    for (t_ssmap::const_iterator iter = m_sortby.begin(); iter != m_sortby.end(); ++iter) {
        rval[idx].first = iter->first;
        rval[idx].second = iter->second;
        ++idx;
    }
    return rval;
}

const t_aggspecvec&
t_config::get_aggregates() const {
    return m_aggregates;
}

t_bool
t_config::has_filters() const {
    switch (m_fmode) {
        case FMODE_SIMPLE_CLAUSES: {
            return !m_fterms.empty();
        } break;
        default: { return false; }
    }
    return false;
}

const t_ftermvec&
t_config::get_fterms() const {
    return m_fterms;
}

t_filter_op
t_config::get_combiner() const {
    return m_combiner;
}

t_totals
t_config::get_totals() const {
    return m_totals;
}

t_pivotvec
t_config::get_pivots() const {
    t_pivotvec rval = m_row_pivots;
    for (const auto& piv : m_col_pivots) {
        rval.push_back(piv);
    }
    return rval;
}

t_bool
t_config::handle_nan_sort() const {
    return m_handle_nan_sort;
}

t_str
t_config::get_parent_pkey_column() const {
    return m_parent_pkey_column;
}

t_str
t_config::get_child_pkey_column() const {
    return m_child_pkey_column;
}

const t_str&
t_config::get_grouping_label_column() const {
    return m_grouping_label_column;
}

t_config_recipe
t_config::get_recipe() const {
    t_config_recipe rv;

    for (const auto& p : m_row_pivots) {
        rv.m_row_pivots.push_back(p.get_recipe());
    }

    for (const auto& p : m_col_pivots) {
        rv.m_col_pivots.push_back(p.get_recipe());
    }

    rv.m_sortby = get_sortby_pairs();

    for (const auto& a : m_aggregates) {
        rv.m_aggregates.push_back(a.get_recipe());
    }

    rv.m_totals = m_totals;
    rv.m_combiner = m_combiner;

    for (const auto& ft : m_fterms) {
        rv.m_fterms.push_back(ft.get_recipe());
    }

    rv.m_handle_nan_sort = m_handle_nan_sort;
    rv.m_parent_pkey_column = m_parent_pkey_column;
    rv.m_child_pkey_column = m_child_pkey_column;
    rv.m_grouping_label_column = m_grouping_label_column;
    return rv;
}

t_str
t_config::unity_get_column_name(t_uindex idx) const {
    if (m_aggregates.empty()) {
        if (idx >= m_detail_columns.size())
            return "";
        return m_detail_columns[idx];
    }

    return m_aggregates[idx % m_aggregates.size()].name();
}

t_str
t_config::unity_get_column_display_name(t_uindex idx) const {
    if (m_aggregates.empty()) {
        if (idx >= m_detail_columns.size())
            return "";
        return m_detail_columns[idx];
    }

    return m_aggregates[idx % m_aggregates.size()].disp_name();
}

t_fmode
t_config::get_fmode() const {
    return m_fmode;
}

} // end namespace perspective
