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

namespace perspective {

struct PERSPECTIVE_EXPORT t_config_recipe {
    t_config_recipe();

    t_pivot_recipevec m_row_pivots;
    t_pivot_recipevec m_col_pivots;
    t_sspvec m_sortby;
    t_aggspec_recipevec m_aggregates;
    t_svec m_detail_columns;
    t_totals m_totals;
    t_filter_op m_combiner;
    t_fterm_recipevec m_fterms;
    t_bool m_handle_nan_sort;
    t_str m_parent_pkey_column;
    t_str m_child_pkey_column;
    t_str m_grouping_label_column;
    t_fmode m_fmode;
    t_svec m_filter_exprs;
};

class PERSPECTIVE_EXPORT t_config {
public:
    t_config();
    t_config(const t_config_recipe& r);
    t_config(const t_pivotvec& row_pivots, const t_aggspecvec& aggregates);
    t_config(const t_pivotvec& row_pivots, const t_pivotvec& col_pivots,
        const t_aggspecvec& aggregates, const t_svec& detail_columns, const t_totals totals,
        const t_svec& sort_pivot, const t_svec& sort_pivot_by, t_filter_op combiner,
        const t_ftermvec& fterms, t_bool handle_nan_sort, const t_str& parent_pkey_column,
        const t_str& child_pkey_column, const t_str& grouping_label_column, t_fmode fmode,
        const t_svec& filter_exprs, const t_str& grand_agg_str);

    // grouped_pkeys
    t_config(const t_svec& row_pivots, const t_svec& detail_columns, t_filter_op combiner,
        const t_ftermvec& fterms, const t_str& parent_pkey_column,
        const t_str& child_pkey_column, const t_str& grouping_label_column);

    // ctx2
    t_config(const t_svec& row_pivots, const t_svec& col_pivots, const t_aggspecvec& aggregates,
        const t_totals totals, t_filter_op combiner, const t_ftermvec& fterms);

    // t_ctx1
    t_config(const t_svec& row_pivots, const t_aggspecvec& aggregates);

    t_config(const t_svec& row_pivots, const t_aggspecvec& aggregates, t_filter_op combiner,
        const t_ftermvec& fterms);

    // t_ctx0
    t_config(const t_svec& detail_columns, t_filter_op combiner, const t_ftermvec& fterms);

    void setup(
        const t_svec& detail_columns, const t_svec& sort_pivot, const t_svec& sort_pivot_by);

    t_index get_colidx(const t_str& colname) const;

    t_str repr() const;

    t_uindex get_num_aggregates() const;

    t_uindex get_num_columns() const;

    t_str col_at(t_uindex idx) const;

    bool has_pkey_agg() const;

    t_str get_totals_string() const;

    t_str get_sort_by(const t_str& pivot) const;

    bool validate_colidx(t_index idx) const;

    t_svec get_column_names() const;
    t_uindex get_num_rpivots() const;
    t_uindex get_num_cpivots() const;

    t_pivotvec get_pivots() const;
    const t_pivotvec& get_row_pivots() const;
    const t_pivotvec& get_column_pivots() const;
    const t_aggspecvec& get_aggregates() const;

    t_sspvec get_sortby_pairs() const;

    t_bool has_filters() const;

    const t_ftermvec& get_fterms() const;

    t_totals get_totals() const;

    t_filter_op get_combiner() const;

    t_bool handle_nan_sort() const;

    t_str get_parent_pkey_column() const;

    t_str get_child_pkey_column() const;

    const t_str& get_grouping_label_column() const;

    t_config_recipe get_recipe() const;

    t_str unity_get_column_name(t_uindex idx) const;
    t_str unity_get_column_display_name(t_uindex idx) const;
    t_fmode get_fmode() const;

    inline const t_str&
    get_grand_agg_str() const {
        return m_grand_agg_str;
    }

protected:
    void populate_sortby(const t_pivotvec& pivots);

private:
    t_pivotvec m_row_pivots;
    t_pivotvec m_col_pivots;
    t_ssmap m_sortby;
    t_aggspecvec m_aggregates;
    t_svec m_detail_columns;
    t_totals m_totals;
    t_sidxmap m_detail_colmap;
    bool m_has_pkey_agg;
    t_uindex m_row_expand_depth;
    t_uindex m_col_expand_depth;
    t_filter_op m_combiner;
    t_ftermvec m_fterms;
    t_bool m_handle_nan_sort;
    t_str m_parent_pkey_column;
    t_str m_child_pkey_column;
    t_str m_grouping_label_column;
    t_fmode m_fmode;
    t_svec m_filter_exprs;
    t_str m_grand_agg_str;
};

} // end namespace perspective
