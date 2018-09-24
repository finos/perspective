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
#include <perspective/shared_ptrs.h>
#include <perspective/config.h>
#include <perspective/gnode_state.h>
#include <perspective/traversal.h>

namespace perspective {

PERSPECTIVE_EXPORT void notify_sparse_tree_common(t_table_sptr strands,
    t_table_sptr strand_deltas, t_stree_sptr tree, t_trav_sptr traversal,
    t_bool process_traversal, const t_aggspecvec& aggregates, const t_sspvec& tree_sortby,
    const t_sortsvec& ctx_sortby, const t_gstate& gstate);

PERSPECTIVE_EXPORT void notify_sparse_tree(t_stree_sptr tree, t_trav_sptr traversal,
    t_bool process_traversal, const t_aggspecvec& aggregates, const t_sspvec& tree_sortby,
    const t_sortsvec& ctx_sortby, const t_table& flattened, const t_table& delta,
    const t_table& prev, const t_table& current, const t_table& transitions,
    const t_table& existed, const t_config& config, const t_gstate& gstate);

PERSPECTIVE_EXPORT void notify_sparse_tree(t_stree_sptr tree, t_trav_sptr traversal,
    t_bool process_traversal, const t_aggspecvec& aggregates, const t_sspvec& tree_sortby,
    const t_sortsvec& ctx_sortby, const t_table& flattened, const t_config& config,
    const t_gstate& gstate);

template <typename CONTEXT_T>
void
ctx_expand_path(CONTEXT_T& ctx, t_header header, t_stree_sptr tree, t_trav_sptr traversal,
    const t_tscalvec& path) {
    t_index root = 0;
    t_tvidx bidx = 0;

    for (int j = 0, loop_end = path.size(); j < loop_end; j++) {
        const t_tscalar& datum = path[j];
        root = tree->resolve_child(root, datum);

        if (root < 0) {
            break;
        }

        t_tvidx tvidx = traversal->tree_index_lookup(root, bidx);

        bidx = tvidx;
        ctx.open(header, tvidx);
    }
}

template <typename CONTEXT_T>
void
ctx_set_expansion_state(CONTEXT_T& ctx, t_header header, t_stree_sptr tree,
    t_trav_sptr traversal, const t_pathvec& paths) {
    for (int i = 0, loop_end = paths.size(); i < loop_end; i++) {
        const t_path& path = paths[i];
        ctx_expand_path(ctx, header, tree, traversal, path.m_path);
    }
}

PERSPECTIVE_EXPORT t_pathvec ctx_get_expansion_state(
    t_stree_csptr tree, t_trav_csptr traversal);

PERSPECTIVE_EXPORT t_tscalvec ctx_get_path(
    t_stree_csptr tree, t_trav_csptr traversal, t_tvidx idx);

PERSPECTIVE_EXPORT t_ftnvec ctx_get_flattened_tree(t_tvidx idx, t_depth stop_depth,
    t_traversal& trav, const t_config& config, const t_sortsvec& sortby);

} // end namespace perspective
