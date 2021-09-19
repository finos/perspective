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
#include <perspective/data_table.h>
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
    typedef std::shared_ptr<const t_data_table> t_dssptr;

    t_dtree(t_dssptr ds, const std::vector<t_pivot>& pivots,
        const std::vector<std::pair<std::string, std::string>>& sortby_columns);
    t_dtree(const std::string& dirname, t_dssptr ds,
        const std::vector<t_pivot>& pivots, t_backing_store backing_store,
        const std::vector<std::pair<std::string, std::string>>& sortby_columns);

    void init();
    std::string repr() const;
    std::string leaves_colname() const;
    std::string nodes_colname() const;
    std::string values_colname(const std::string& tbl_colname) const;
    void check_pivot(const t_filter& f, t_uindex level);
    void pivot(const t_filter& f, t_uindex level);

    t_uindex size() const;

    t_tscalar _get_value(
        const t_filter& filter, t_index nidx, bool sort_value) const;
    t_tscalar get_value(const t_filter& filter, t_index nidx) const;
    t_tscalar get_sortby_value(const t_filter& filter, t_index nidx) const;

    t_uindex get_depth(t_index idx) const;
    std::pair<t_index, t_index> get_level_markers(t_uindex idx) const;
    const t_tnode* get_node_ptr(t_index idx) const;
    t_uindex last_level() const;
    std::pair<t_uindex, t_uindex> get_span_index(t_index idx) const;
    void pprint(const t_filter& filter) const;
    const t_column* get_leaf_cptr() const;

    t_bfs_iter<t_dtree> bfs() const;
    t_dfs_iter<t_dtree> dfs() const;
    t_index get_parent(t_index idx) const;
    const std::vector<t_pivot>& get_pivots() const;
    void get_child_indices(t_index idx, std::vector<t_index>& out_data) const;

private:
    std::string m_dirname;
    t_uindex m_levels_pivoted;
    t_dssptr m_ds;
    std::vector<std::pair<t_uindex, t_uindex>> m_levels;
    std::vector<t_pivot> m_pivots;
    t_column m_leaves;
    t_tnodevec m_nodes;
    std::vector<t_column> m_values;
    t_uindex m_nidx;
    t_backing_store m_backing_store;
    bool m_init;
    std::vector<std::string> m_sortby_dpthcol;
    std::vector<std::pair<std::string, std::string>> m_sortby_colvec;
    std::map<std::string, std::string> m_sortby_columns;
    std::vector<bool> m_has_sortby;
};

} // end namespace perspective
