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
#include <perspective/raw_types.h>
#include <perspective/exports.h>
#include <perspective/base.h>
#include <perspective/scalar.h>
#include <perspective/traversal_nodes.h>
#include <perspective/column.h>

namespace perspective
{

class t_ctx1;
class t_ctx2;

struct PERSPECTIVE_EXPORT t_trav_iter_node
{
    t_trav_iter_node(const t_tscalar& value,
                     bool expanded,
                     t_depth depth,
                     t_index ndesc,
                     t_ptidx tnid,
                     t_tvidx ridx,
                     t_tvidx pridx);

    t_tscalar value;
    bool expanded;
    t_depth depth;
    t_tvidx ndesc;
    t_ptidx tree_handle;
    t_tvidx idx;
    t_tvidx pidx;
};

struct PERSPECTIVE_EXPORT t_leaf_iter_node
{
    t_leaf_iter_node(const t_tscalar& value,
                     bool expanded,
                     t_depth depth,
                     t_index ndesc,
                     t_ptidx tnid,
                     t_tvidx ridx,
                     t_tvidx pridx,
                     t_index nleaves);

    t_tscalar value;
    bool expanded;
    t_depth depth;
    t_tvidx ndesc;
    t_ptidx tree_handle;
    t_tvidx idx;
    t_tvidx pidx;
    t_index nleaves;
    t_index col_start;
};

class PERSPECTIVE_EXPORT t_ctx2_trav_seq_iter
{
  public:
    t_ctx2_trav_seq_iter(t_ctx2* ctx, t_header header);
    bool has_next() const;
    t_trav_iter_node* next();

  private:
    const t_ctx2* m_ctx;
    t_header m_header;
    t_tvidx m_curidx;
    t_index m_nrows;
};

class PERSPECTIVE_EXPORT t_ctx2_leaf_iter
{
  public:
    t_ctx2_leaf_iter(const t_ctx2* ctx, t_header header);
    bool has_next() const;
    t_leaf_iter_node* next();

  private:
    const t_ctx2* m_ctx;
    t_header m_header;
    t_tvidx m_curidx;
    t_index m_nrows;
};

class PERSPECTIVE_EXPORT t_ctx1_tree_iter
{
  public:
    t_ctx1_tree_iter(t_ctx1* ctx, t_tvidx root, t_depth depth);
    t_ctx1_tree_iter(t_ctx1* ctx,
                     t_tvidx root,
                     t_depth depth,
                     const t_idxvec& aggregates);

    bool has_next() const;

    PyObject* next();

  private:
    t_depth m_edepth;
    t_index m_curidx;
    t_ftnvec m_vec;
    bool m_has_next;
    t_ctx1* m_ctx;
    t_idxvec m_agg_indices;
    t_colcptrvec m_aggcols;
};

} // end namespace perspective
