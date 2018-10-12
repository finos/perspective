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

namespace perspective {

class PERSPECTIVE_EXPORT t_ctx2 : public t_ctxbase<t_ctx2> {
public:
#include <perspective/context_common_decls.h>
    t_ctx2();

    t_ctx2(const t_schema& schema, const t_config& config);

    ~t_ctx2();

    t_index open(t_header header, t_tvidx idx);
    t_index close(t_header header, t_tvidx idx);

    t_totals get_totals() const;
    t_tvivec get_ctraversal_indices() const;
    t_uindex get_num_view_columns() const;

    t_tscalvec get_row_path(t_tvidx idx) const;
    t_tscalvec get_row_path(const t_tvnode& node) const;

    t_tscalvec get_column_path(t_tvidx idx) const;
    t_tscalvec get_column_path(const t_tvnode& node) const;
    t_tscalvec get_column_path_userspace(t_tvidx idx) const;

    t_aggspecvec get_aggregates() const;

    void set_depth(t_header header, t_depth depth);

    using t_ctxbase<t_ctx2>::get_data;

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

    t_uindex calc_translated_colidx(t_uindex n_aggs, t_uindex cidx) const;

private:
    t_trav_sptr m_rtraversal;
    t_trav_sptr m_ctraversal;
    t_sortsvec m_sortby;
    t_bool m_rows_changed;
    std::vector<t_stree_sptr> m_trees;
    t_sortsvec m_row_sortby;
    t_sortsvec m_column_sortby;
    t_depth m_row_depth;
    t_bool m_row_depth_set;
    t_depth m_column_depth;
    t_bool m_column_depth_set;
};

typedef std::shared_ptr<t_ctx2> t_ctx2_sptr;

} // end namespace perspective
