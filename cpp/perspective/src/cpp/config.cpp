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

// t_ctxunit
t_config::t_config(const std::vector<std::string>& detail_columns)
    : t_config(detail_columns, {}, FILTER_OP_AND, {}) {}

// t_ctx0
t_config::t_config(
    const std::vector<std::string>& detail_columns,
    const std::vector<t_fterm>& fterms,
    t_filter_op combiner,
    const std::vector<t_computed_expression>& expressions)
    : m_detail_columns(detail_columns)
    , m_fterms(fterms)
    , m_expressions(expressions)
    , m_combiner(combiner)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {
    init();
}

// t_ctx1
t_config::t_config(
    const std::vector<std::string>& row_pivots,
    const std::vector<t_aggspec>& aggregates,
    const std::vector<t_fterm>& fterms,
    t_filter_op combiner,
    const std::vector<t_computed_expression>& expressions)
    : m_aggregates(aggregates)
    , m_fterms(fterms)
    , m_expressions(expressions)
    , m_combiner(combiner)
    , m_totals(TOTALS_BEFORE)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {
    for (const auto& p : row_pivots) {
        m_row_pivots.push_back(t_pivot(p));
    }

    init();
}

// t_ctx2
t_config::t_config(
    const std::vector<std::string>& row_pivots,
    const std::vector<std::string>& col_pivots,
    const std::vector<t_aggspec>& aggregates,
    const t_totals totals,
    const std::vector<t_fterm>& fterms,
    t_filter_op combiner,
    const std::vector<t_computed_expression>& expressions,
    bool column_only)
    : m_aggregates(aggregates)
    , m_fterms(fterms)
    , m_expressions(expressions)
    , m_combiner(combiner)
    , m_column_only(column_only)
    , m_totals(totals)
    , m_fmode(FMODE_SIMPLE_CLAUSES) {
    for (const auto& p : row_pivots) {
        m_row_pivots.push_back(t_pivot(p));
    }

    for (const auto& p : col_pivots) {
        m_col_pivots.push_back(t_pivot(p));
    }

    init();
}

t_config::t_config() {}

void
t_config::init() {
    const auto& expressions = get_expressions();

    for (const auto& expression : expressions) {
        m_expression_alias_map[expression.get_expression_alias()] = expression.get_expression_string();
    }

    for (auto i = 0; i < m_detail_columns.size(); ++i) {
        // const std::string& column = detail_columns[i];
        // if (m_expression_alias_map.count(column) != 0) {
        //     detail_columns[i] = m_expression_alias_map.at(column);
        // }

        m_detail_colmap[m_detail_columns[i]] = i;
    }

    m_has_pkey_agg = false;

    for (std::vector<t_aggspec>::const_iterator iter = m_aggregates.begin();
         iter != m_aggregates.end(); ++iter) {
        switch (iter->agg()) {
            case AGGTYPE_AND:
            case AGGTYPE_OR:
            case AGGTYPE_ANY:
            case AGGTYPE_FIRST:
            case AGGTYPE_LAST_BY_INDEX:
            case AGGTYPE_MEAN:
            case AGGTYPE_WEIGHTED_MEAN:
            case AGGTYPE_UNIQUE:
            case AGGTYPE_MEDIAN:
            case AGGTYPE_JOIN:
            case AGGTYPE_DOMINANT:
            case AGGTYPE_PY_AGG:
            case AGGTYPE_SUM_NOT_NULL:
            case AGGTYPE_SUM_ABS:
            case AGGTYPE_ABS_SUM:
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

    populate_sortby(m_row_pivots);
    populate_sortby(m_col_pivots);
}

void
t_config::populate_sortby(const std::vector<t_pivot>& pivots) {
    for (t_index idx = 0, loop_end = pivots.size(); idx < loop_end; ++idx) {
        const t_pivot& pivot = pivots[idx];

        PSP_VERBOSE_ASSERT(
            pivot.mode() == PIVOT_MODE_NORMAL, "Only normal pivots supported for now");
        std::string pstr = pivot.colname();
        if (m_sortby.find(pstr) == m_sortby.end())
            m_sortby[pstr] = pstr;
    }
}

t_index
t_config::get_colidx(const std::string& colname) const {
    std::map<std::string, t_index>::const_iterator iter = m_detail_colmap.find(colname);
    if (iter == m_detail_colmap.end()) {
        return INVALID_INDEX;
    } else {
        return iter->second;
    }
}

std::string
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

std::string
t_config::col_at(t_uindex idx) const {
    if (idx >= m_detail_columns.size())
        return "";
    return m_detail_columns[idx];
}

bool
t_config::has_pkey_agg() const {
    return m_has_pkey_agg;
}

std::string
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

std::string
t_config::get_sort_by(const std::string& pivot) const {
    std::string rval;
    std::map<std::string, std::string>::const_iterator iter = m_sortby.find(pivot);

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

std::vector<std::string>
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

bool
t_config::is_column_only() const {
    return m_column_only;
}

const std::vector<t_pivot>&
t_config::get_row_pivots() const {
    return m_row_pivots;
}

const std::vector<t_pivot>&
t_config::get_column_pivots() const {
    return m_col_pivots;
}

std::vector<std::pair<std::string, std::string>>
t_config::get_sortby_pairs() const {
    std::vector<std::pair<std::string, std::string>> rval(m_sortby.size());
    t_uindex idx = 0;
    for (std::map<std::string, std::string>::const_iterator iter = m_sortby.begin();
         iter != m_sortby.end(); ++iter) {
        rval[idx].first = iter->first;
        rval[idx].second = iter->second;
        ++idx;
    }
    return rval;
}

const std::vector<t_sortspec>&
t_config::get_sortspecs() const {
    return m_sortspecs;
}

const std::vector<t_sortspec>&
t_config::get_col_sortspecs() const {
    return m_col_sortspecs;
}

const std::vector<t_aggspec>&
t_config::get_aggregates() const {
    return m_aggregates;
}

bool
t_config::has_filters() const {
    switch (m_fmode) {
        case FMODE_SIMPLE_CLAUSES: {
            return !m_fterms.empty();
        } break;
        default: { return false; }
    }
    return false;
}

const std::vector<t_fterm>&
t_config::get_fterms() const {
    return m_fterms;
}

const std::vector<t_computed_expression>&
t_config::get_expressions() const {
    return m_expressions;
}

const tsl::hopscotch_map<std::string, std::string>&
t_config::get_expression_alias_map() const {
    return m_expression_alias_map;
}

t_filter_op
t_config::get_combiner() const {
    return m_combiner;
}

t_totals
t_config::get_totals() const {
    return m_totals;
}

std::vector<t_pivot>
t_config::get_pivots() const {
    std::vector<t_pivot> rval = m_row_pivots;
    for (const auto& piv : m_col_pivots) {
        rval.push_back(piv);
    }
    return rval;
}

std::string
t_config::get_parent_pkey_column() const {
    return m_parent_pkey_column;
}

std::string
t_config::get_child_pkey_column() const {
    return m_child_pkey_column;
}

const std::string&
t_config::get_grouping_label_column() const {
    return m_grouping_label_column;
}

std::string
t_config::unity_get_column_name(t_uindex idx) const {
    if (m_aggregates.empty()) {
        if (idx >= m_detail_columns.size())
            return "";
        return m_detail_columns[idx];
    }

    return m_aggregates[idx % m_aggregates.size()].name();
}

std::string
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
