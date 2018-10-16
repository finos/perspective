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
#include <perspective/raw_types.h>
#include <perspective/exports.h>
#include <perspective/multi_sort.h>
#include <perspective/traversal_nodes.h>
#include <perspective/shared_ptrs.h>
#include <perspective/sort_specification.h>
#include <perspective/sparse_tree_node.h>
#include <perspective/arg_sort.h>
#include <algorithm>
#include <queue>

SUPPRESS_WARNINGS_VC(4503)

namespace perspective {

class t_config;
class t_ctx2;

class t_traversal {
public:
    t_traversal(t_stree_csptr tree, t_bool handle_nan_sort);

    t_index expand_node(t_tvidx exp_idx);

    t_index expand_node(const t_sortsvec& sortby, t_tvidx exp_idx, t_ctx2* ctx2 = nullptr);

    t_index collapse_node(t_tvidx idx);

    void add_node(const t_sortsvec& sortby, const t_uidxvec& indices, t_index insert_level_idx,
        t_ctx2* ctx2 = nullptr);

    t_rcode update_ancestors(t_tvidx nidx, t_index n_changed);

    t_rcode update_sucessors(t_tvidx nidx, t_index n_changed);

    t_ptidx get_tree_index(t_tvidx idx) const;

    t_uindex size() const;

    t_depth get_depth(t_tvidx idx) const;

    t_tvidx get_traversal_index(t_ptidx idx);

    t_vdnvec get_view_nodes(t_tvidx bidx, t_tvidx eidx) const;

    void get_expanded_span(const t_uidxvec& in_ptidxes, t_tvivec& out_tvidxes,
        t_tvidx& out_collpsed_ancestor, t_index insert_level_idx);

    bool validate_cells(const t_uidxpvec& cells) const;

    t_index remove_subtree(t_tvidx idx);

    void pprint() const;

    t_tvnode get_node(t_tvidx idx) const;

    void get_leaves(t_tvivec& out_data) const;

    template <typename SRC_T>
    void sort_by(const t_config& config, const t_sortsvec& sortby, const SRC_T& src,
        t_ctx2* ctx2 = nullptr);

    void get_child_indices(
        t_tvidx nidx, std::vector<std::pair<t_tvidx, t_ptidx>>& out_data) const;

    void print_stats();

    t_index get_num_tree_leaves(t_tvidx idx) const;

    void post_order(t_tvidx nidx, t_tvivec& out_vec);

    // Traversal
    t_index set_depth(const t_sortsvec& sortby, t_depth depth, t_ctx2* ctx2 = nullptr);

    t_ftnvec get_flattened_tree(t_tvidx idx, t_depth stop_depth) const;

    t_tvidx tree_index_lookup(t_ptidx idx, t_tvidx bidx) const;

    void get_node_ancestors(t_tvidx nidx, t_tvivec& ancestors) const;

    void get_expanded(t_ptivec& expanded_tidx) const;

    t_bool get_node_expanded(t_tvidx idx) const;

    void drop_tree_indices(const t_uidxvec& indices);

    t_bool is_valid_idx(t_tvidx idx) const;

    const t_stree* get_tree() const;

    void populate_root_children(const t_stnode_vec& rchildren);
    void populate_root_children(t_stree_csptr tree);

private:
    t_stree_csptr m_tree;
    t_sptr_tvnodes m_nodes;
    t_tvidx m_curidx;
    t_bool m_handle_nan_sort;
};

template <typename SRC_T>
void
t_traversal::sort_by(
    const t_config& config, const t_sortsvec& sortby, const SRC_T& src, t_ctx2* ctx2) {
    t_tvnvec new_nodes(m_nodes->size());

    // Pair is -> (old tvidx, new tvidx)
    std::vector<std::pair<t_tvidx, t_tvidx>> queue;

    // Add root to queue
    new_nodes[0] = (*m_nodes)[0];
    queue.emplace_back(std::pair<t_tvidx, t_tvidx>(0, 0));

    t_idxvec sortby_agg_indices(sortby.size());

    t_uindex scount = 0;
    for (const auto& s : sortby) {
        sortby_agg_indices[scount] = s.m_agg_index;
        ++scount;
    }

    // while queue is not empty
    while (!queue.empty()) {
        // get head
        const std::pair<t_tvidx, t_tvidx> head_info = queue.back();
        queue.pop_back();

        // Heads idx in current traversal
        t_tvidx h_ctvidx = head_info.first;

        // Heads idx in new traversal
        t_tvidx h_ntvidx = head_info.second;

        const t_tvnode& head = (*m_nodes)[h_ctvidx];

        std::vector<std::pair<t_tvidx, t_ptidx>> h_children;
        get_child_indices(h_ctvidx, h_children);

        if (!h_children.empty()) {
            // Get sorted indices
            auto n_changed = h_children.size();
            t_idxvec sorted_idx(n_changed);
            t_ptivec children_ptidx(n_changed);
            auto sortelems = std::make_shared<t_mselemvec>(size_t(n_changed));
            auto num_aggs = sortby.size();
            t_tscalvec aggregates(num_aggs);

            for (t_uindex i = 0, loop_end = n_changed; i < loop_end; i++) {
                children_ptidx[i] = h_children[i].second;

                src.get_aggregates_for_sorting(
                    children_ptidx[i], sortby_agg_indices, aggregates, ctx2);

                (*sortelems)[i] = t_mselem(aggregates, static_cast<t_uindex>(i));
            }

            t_sorttvec sort_orders = get_sort_orders(sortby);
            t_multisorter sorter(sortelems, sort_orders, m_handle_nan_sort);
            argsort(sorted_idx, sorter);

            auto nchild = n_changed;
            t_index ndesc = head.m_ndesc;

            // Fast path - if none of heads children are
            // expanded
            if (ndesc == nchild) {
                // Set contiguous block in traversal for
                // children
                auto bidx = h_ntvidx + 1;
                auto eidx = bidx + nchild;

                for (t_index idx = bidx; idx < eidx; idx++) {
                    t_index cidx = sorted_idx[idx - bidx];
                    t_tvidx c_otvidx = h_children[cidx].first;
                    new_nodes[idx] = (*m_nodes)[c_otvidx];
                    new_nodes[idx].m_rel_pidx = idx - bidx + 1;
                }
            } else {
                t_tvidx c_ntvidx = h_ntvidx + 1;

                for (t_uindex idx = 0, loop_end = h_children.size(); idx < loop_end; idx++) {
                    // For each child of head
                    t_index cidx = sorted_idx[idx];
                    t_tvidx c_otvidx = h_children[cidx].first;

                    const t_tvnode& child = (*m_nodes)[c_otvidx];

                    // Enqueue child if it is expanded
                    if (child.m_expanded) {
                        queue.emplace_back(std::pair<t_tvidx, t_tvidx>(c_otvidx, c_ntvidx));
                    }

                    new_nodes[c_ntvidx] = (*m_nodes)[c_otvidx];
                    new_nodes[c_ntvidx].m_rel_pidx = c_ntvidx - h_ntvidx;
                    c_ntvidx = c_ntvidx + child.m_ndesc + 1;
                }
            }
        }
    }

    std::swap(*m_nodes, new_nodes);
}
typedef std::shared_ptr<t_traversal> t_trav_sptr;
typedef std::shared_ptr<const t_traversal> t_trav_csptr;

} // end namespace perspective
