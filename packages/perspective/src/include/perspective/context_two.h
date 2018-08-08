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
#include <perspective/context_base.h>
#include <perspective/sort_specification.h>
#include <perspective/path.h>
#include <perspective/shared_ptrs.h>
#include <perspective/sparse_tree_node.h>
#include <perspective/traversal_nodes.h>

namespace perspective
{

template <typename CONTEXT_T>
class t_leaf_data_iter;

class PERSPECTIVE_EXPORT t_ctx2 : public t_ctxbase<t_ctx2>
{
  public:
#include <perspective/context_common_decls.h>
    t_ctx2();

    t_ctx2(const t_schema& schema, const t_config& config);

    ~t_ctx2();

    // ASGGrid data interface

    t_vdnvec get_view_nodes(t_tvidx start_row, t_tvidx end_row) const;

    t_index open(t_header header, t_tvidx idx);
    t_index close(t_header header, t_tvidx idx);

    // End ASGGrid data interface

    t_index get_row_count(t_header header) const;
    t_pivotvec get_row_pivots() const;
    t_pivotvec get_column_pivots() const;

    t_pathvec get_expansion_state(t_header header) const;
    void set_expansion_state(t_header header, const t_pathvec& paths);

    t_stree* _get_ctree();
    t_stree* _get_rtree();

    t_totals get_totals() const;
    t_tvivec get_ctraversal_indices() const;
    t_uindex get_num_view_columns() const;

    t_uindex get_max_levels(t_header header) const;
    t_uindex get_num_levels(t_header header) const;

    t_tscalvec get_row_path(t_tvidx idx) const;
    t_tscalvec get_row_path(const t_tvnode& node) const;

    t_tscalvec get_column_path(t_tvidx idx) const;
    t_tscalvec get_column_path(const t_tvnode& node) const;
    t_tscalvec get_column_path_userspace(t_tvidx idx) const;

    t_trav_csptr get_traversal(t_header header) const;

    t_tscalar get_tree_value(t_header header, t_ptidx nidx) const;

    t_aggspec get_aggregate(t_uindex idx) const;
    t_aggspecvec get_aggregates() const;

    void expand_to_depth(t_header header, t_depth depth);

    void collapse_to_depth(t_header header, t_depth depth);
    void expand_path(t_header header, const t_tscalvec& path);

    t_uindex get_leaf_count(t_header header, t_uindex depth) const;

    t_tscalvec get_leaf_data(t_uindex row_depth,
                             t_uindex col_depth,
                             t_uindex start_row,
                             t_uindex end_row,
                             t_uindex start_col,
                             t_uindex end_col) const;

    t_leaf_data_iter<t_ctx2> iter_leaf_data(const t_idxvec& idxs,
                                            t_uindex row_depth,
                                            t_uindex col_depth) const;

    t_index get_row_idx(const t_tscalvec& path) const;
    t_tvnode get_trav_node(t_header header, t_tvidx idx) const;
    t_index get_trav_num_tree_leaves(t_header header,
                                     t_tvidx idx) const;
    using t_ctxbase<t_ctx2>::get_data;

    t_tscalvec get_data_old_path(t_tvidx start_row,
                 t_tvidx end_row,
                 t_tvidx start_col,
                 t_tvidx end_col) const;

  protected:
    t_cinfovec resolve_cells(const t_uidxpvec& cells) const;

    t_stree_sptr rtree();
    t_stree_csptr rtree() const;

    t_stree_sptr ctree();
    t_stree_csptr ctree() const;

    t_uindex is_rtree_idx(t_uindex idx) const;
    t_uindex is_ctree_idx(t_uindex idx) const;

    t_tvidx translate_column_index(t_tvidx idx) const;

    t_uindex get_num_trees() const;

    t_uindex calc_translated_colidx(t_uindex n_aggs,
                                    t_uindex cidx) const;

  private:
    t_trav_sptr m_rtraversal;
    t_trav_sptr m_ctraversal;
    t_sortsvec m_sortby;
    t_bool m_rows_changed;
    std::vector<t_stree_sptr> m_trees;
    t_sortsvec m_row_sortby;
    t_sortsvec m_column_sortby;
};

typedef std::shared_ptr<t_ctx2> t_ctx2_sptr;

} // end namespace perspective
