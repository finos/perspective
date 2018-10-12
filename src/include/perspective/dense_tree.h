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
#include <perspective/pivot.h>
#include <perspective/dense_nodes.h>
#include <perspective/exports.h>
#include <perspective/shared_ptrs.h>
#include <perspective/tree_iterator.h>
#include <perspective/column.h>
#include <sstream>
#include <csignal>
#include <queue>

// Pass filter in and store the filter on the tree
// as a shared ptr

namespace perspective {

class t_filter;

class t_dtree {
public:
    typedef t_dense_tnode t_tnode;
    typedef std::vector<t_tnode> t_tnodevec;
    typedef t_table_csptr t_dssptr;

    t_dtree(t_dssptr ds, const t_pivotvec& pivots, const t_sspvec& sortby_columns);
    t_dtree(const t_str& dirname, t_dssptr ds, const t_pivotvec& pivots,
        t_backing_store backing_store, const t_sspvec& sortby_columns);

    void init();
    t_str repr() const;
    t_str leaves_colname() const;
    t_str nodes_colname() const;
    t_str values_colname(const t_str& tbl_colname) const;
    void check_pivot(const t_filter& f, t_uindex level);
    void pivot(const t_filter& f, t_uindex level);

    t_uindex size() const;

    t_tscalar _get_value(const t_filter& filter, t_ptidx nidx, t_bool sort_value) const;
    t_tscalar get_value(const t_filter& filter, t_ptidx nidx) const;
    t_tscalar get_sortby_value(const t_filter& filter, t_ptidx nidx) const;

    t_uindex get_depth(t_ptidx idx) const;
    t_ptipair get_level_markers(t_uindex idx) const;
    const t_tnode* get_node_ptr(t_ptidx idx) const;
    t_uindex last_level() const;
    t_uidxpair get_span_index(t_ptidx idx) const;
    void pprint(const t_filter& filter) const;
    const t_column* get_leaf_cptr() const;

    t_bfs_iter<t_dtree> bfs() const;
    t_dfs_iter<t_dtree> dfs() const;
    t_ptidx get_parent(t_ptidx idx) const;
    const t_pivotvec& get_pivots() const;

private:
    t_str m_dirname;
    t_uindex m_levels_pivoted;
    t_dssptr m_ds;
    t_uidxpvec m_levels;
    t_pivotvec m_pivots;
    t_column m_leaves;
    t_tnodevec m_nodes;
    t_colvec m_values;
    t_uindex m_nidx;
    t_backing_store m_backing_store;
    t_bool m_init;
    t_svec m_sortby_dpthcol;
    t_sspvec m_sortby_colvec;
    t_ssmap m_sortby_columns;
    std::vector<t_bool> m_has_sortby;
};

typedef std::shared_ptr<t_dtree> t_dtree_sptr;
typedef std::shared_ptr<const t_dtree> t_dtree_csptr;

} // end namespace perspective
