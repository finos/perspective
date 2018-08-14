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
#include <perspective/exports.h>
#include <perspective/context_base.h>
#include <perspective/traversal.h>
#include <perspective/sparse_tree.h>
#include <perspective/table.h>
#include <perspective/path.h>
#include <perspective/sym_table.h>

namespace perspective
{

template <typename CONTEXT_T>
class t_leaf_data_iter;

class PERSPECTIVE_EXPORT t_ctx_grouped_pkey
    : public t_ctxbase<t_ctx_grouped_pkey>
{
  public:
    t_ctx_grouped_pkey();

    t_ctx_grouped_pkey(const t_schema& schema,
                       const t_config& config);

    ~t_ctx_grouped_pkey();

#include <perspective/context_common_decls.h>

    // ASGGrid data interface

    t_vdnvec get_view_nodes(t_tvidx start_row, t_tvidx end_row) const;

    t_index open(t_header header, t_tvidx idx);
    t_index open(t_tvidx idx);

    t_index close(t_tvidx idx);

    // End ASGGrid data interface

    t_depth get_num_levels() const;
    t_aggspec get_aggregate(t_uindex idx) const;
    t_aggspecvec get_aggregates() const;
    t_pivotvec get_row_pivots() const;
    t_pivotvec get_column_pivots() const;
    t_tscalvec get_row_path(t_tvidx idx) const;
    t_pathvec get_expansion_state() const;
    void set_expansion_state(const t_pathvec& paths);
    t_tscalar get_tree_value(t_ptidx idx) const;
    t_stree* _get_tree();
    t_ftnvec get_flattened_tree(t_tvidx idx, t_depth stop_depth);
    t_trav_csptr get_traversal() const;

    void expand_to_depth(t_depth depth);
    void collapse_to_depth(t_depth depth);

    void expand_path(const t_tscalvec& path);

    t_uindex get_leaf_count(t_depth depth) const;

    t_tscalvec get_leaf_data(t_uindex depth,
                             t_uindex start_row,
                             t_uindex end_row,
                             t_uindex start_col,
                             t_uindex end_col) const;

    t_leaf_data_iter<t_ctx_grouped_pkey>
    iter_leaf_data(const t_idxvec& idxs, t_uindex row_depth) const;
    t_float64 get_min(t_uindex aggidx) const;
    t_float64 get_max(t_uindex aggidx) const;

    t_minmax get_agg_min_max(t_uindex aggidx, t_depth depth) const;

    // aggregates should be presized to be same size
    // as agg_indices
    void get_aggregates_for_sorting(t_uindex nidx,
                        const t_idxvec& agg_indices,
                        t_tscalvec& aggregates,
                        t_ctx2 *) const;

    t_tscalvec
    get_pkeys_without_descendents(const t_uidxpvec& cells) const;

    using t_ctxbase<t_ctx_grouped_pkey>::get_data;

    t_histogram get_histogram(const t_str& cname,
                              t_uindex nbuckets) const;
    t_histogram get_histogram(const t_str& cname,
                              t_uindex nbuckets,
                              t_bool show_filtered) const;

  private:
    void rebuild();

    t_trav_sptr m_traversal;
    t_stree_sptr m_tree;
    t_sortsvec m_sortby;
    t_symtable m_symtable;
    t_bool m_has_label;
};

typedef std::shared_ptr<t_ctx_grouped_pkey> t_ctx_grouped_pkey_sptr;
typedef t_ctx_grouped_pkey t_ctxg;
typedef std::shared_ptr<t_ctx_grouped_pkey> t_ctxg_sptr;
typedef std::vector<t_ctx_grouped_pkey_sptr> t_ctx_grouped_pkey_svec;

} // end namespace perspective
