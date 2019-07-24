/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <perspective/aggspec.h>
#include <perspective/schema.h>
#include <perspective/config.h>
#include <perspective/pivot.h>
#include <perspective/filter.h>
#include <perspective/sort_specification.h>

namespace perspective {

struct PERSPECTIVE_EXPORT t_config_recipe {
    t_config_recipe();

    std::vector<t_pivot_recipe> m_row_pivots;
    std::vector<t_pivot_recipe> m_col_pivots;
    std::vector<std::pair<std::string, std::string>> m_sortby;
    std::vector<std::pair<std::string, std::string>> m_col_sortby;
    std::vector<t_aggspec_recipe> m_aggregates;
    std::vector<std::string> m_detail_columns;
    t_totals m_totals;
    t_filter_op m_combiner;
    std::vector<t_fterm_recipe> m_fterms;
    std::string m_parent_pkey_column;
    std::string m_child_pkey_column;
    std::string m_grouping_label_column;
    t_fmode m_fmode;
    std::vector<std::string> m_filter_exprs;
};

class PERSPECTIVE_EXPORT t_config {
public:
    t_config();
    t_config(const t_config_recipe& r);
    t_config(const std::vector<t_pivot>& row_pivots, const std::vector<t_aggspec>& aggregates);
    t_config(const std::vector<t_pivot>& row_pivots, const std::vector<t_pivot>& col_pivots,
        const std::vector<t_aggspec>& aggregates,
        const std::vector<std::string>& detail_columns, const t_totals totals,
        const std::vector<std::string>& sort_pivot,
        const std::vector<std::string>& sort_pivot_by, t_filter_op combiner,
        const std::vector<t_fterm>& fterms, const std::string& parent_pkey_column,
        const std::string& child_pkey_column, const std::string& grouping_label_column,
        t_fmode fmode, const std::vector<std::string>& filter_exprs,
        const std::string& grand_agg_str);

    // view config
    t_config(const std::vector<std::string>& row_pivots,
        const std::vector<std::string>& column_pivots, const std::vector<t_aggspec>& aggregates,
        const std::vector<t_sortspec>& sortspecs, const std::vector<t_sortspec>& col_sortspecs,
        t_filter_op combiner, const std::vector<t_fterm>& fterms,
        const std::vector<std::string>& col_names, bool column_only);

    // grouped_pkeys
    t_config(const std::vector<std::string>& row_pivots,
        const std::vector<std::string>& detail_columns, t_filter_op combiner,
        const std::vector<t_fterm>& fterms, const std::string& parent_pkey_column,
        const std::string& child_pkey_column, const std::string& grouping_label_column);

    // ctx2
    t_config(const std::vector<std::string>& row_pivots,
        const std::vector<std::string>& col_pivots, const std::vector<t_aggspec>& aggregates);

    t_config(const std::vector<t_pivot>& row_pivots, const std::vector<t_pivot>& col_pivots,
        const std::vector<t_aggspec>& aggregates, const t_totals totals, t_filter_op combiner,
        const std::vector<t_fterm>& fterms, bool column_only);

    t_config(const std::vector<std::string>& row_pivots,
        const std::vector<std::string>& col_pivots, const std::vector<t_aggspec>& aggregates,
        const t_totals totals, t_filter_op combiner, const std::vector<t_fterm>& fterms);

    // t_ctx1
    t_config(
        const std::vector<std::string>& row_pivots, const std::vector<t_aggspec>& aggregates);

    t_config(const std::vector<std::string>& row_pivots, const t_aggspec& agg);

    t_config(const std::vector<t_pivot>& row_pivots, const std::vector<t_aggspec>& aggregates,
        t_filter_op combiner, const std::vector<t_fterm>& fterms);

    t_config(const std::vector<std::string>& row_pivots,
        const std::vector<t_aggspec>& aggregates, t_filter_op combiner,
        const std::vector<t_fterm>& fterms);

    // t_ctx0
    t_config(const std::vector<std::string>& detail_columns);
    t_config(const std::vector<std::string>& detail_columns, t_filter_op combiner,
        const std::vector<t_fterm>& fterms);

    void setup(const std::vector<std::string>& detail_columns,
        const std::vector<std::string>& sort_pivot,
        const std::vector<std::string>& sort_pivot_by);

    t_index get_colidx(const std::string& colname) const;

    std::string repr() const;

    t_uindex get_num_aggregates() const;

    t_uindex get_num_columns() const;

    std::string col_at(t_uindex idx) const;

    bool has_pkey_agg() const;

    std::string get_totals_string() const;

    std::string get_sort_by(const std::string& pivot) const;

    bool validate_colidx(t_index idx) const;

    std::vector<std::string> get_column_names() const;
    t_uindex get_num_rpivots() const;
    t_uindex get_num_cpivots() const;
    bool is_column_only() const;

    std::vector<t_pivot> get_pivots() const;
    const std::vector<t_pivot>& get_row_pivots() const;
    const std::vector<t_pivot>& get_column_pivots() const;
    const std::vector<t_aggspec>& get_aggregates() const;

    std::vector<std::pair<std::string, std::string>> get_sortby_pairs() const;
    const std::vector<t_sortspec>& get_sortspecs() const;
    const std::vector<t_sortspec>& get_col_sortspecs() const;

    bool has_filters() const;

    const std::vector<t_fterm>& get_fterms() const;

    t_totals get_totals() const;

    t_filter_op get_combiner() const;

    std::string get_parent_pkey_column() const;

    std::string get_child_pkey_column() const;

    const std::string& get_grouping_label_column() const;

    t_config_recipe get_recipe() const;

    std::string unity_get_column_name(t_uindex idx) const;
    std::string unity_get_column_display_name(t_uindex idx) const;
    t_fmode get_fmode() const;

    inline const std::string&
    get_grand_agg_str() const {
        return m_grand_agg_str;
    }

protected:
    void populate_sortby(const std::vector<t_pivot>& pivots);

private:
    std::vector<t_pivot> m_row_pivots;
    std::vector<t_pivot> m_col_pivots;
    bool m_column_only;
    std::map<std::string, std::string> m_sortby;
    std::vector<t_sortspec> m_sortspecs;
    std::vector<t_sortspec> m_col_sortspecs;
    std::vector<t_aggspec> m_aggregates;
    std::vector<std::string> m_detail_columns;
    t_totals m_totals;
    std::map<std::string, t_index> m_detail_colmap;
    bool m_has_pkey_agg;
    // t_uindex m_row_expand_depth;
    // t_uindex m_col_expand_depth;
    t_filter_op m_combiner;
    std::vector<t_fterm> m_fterms;
    std::string m_parent_pkey_column;
    std::string m_child_pkey_column;
    std::string m_grouping_label_column;
    t_fmode m_fmode;
    std::vector<std::string> m_filter_exprs;
    std::string m_grand_agg_str;
};

} // end namespace perspective
