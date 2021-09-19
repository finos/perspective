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
#include <memory>

namespace perspective {
struct PERSPECTIVE_EXPORT t_tvnode {
    bool m_expanded;
    t_uindex m_depth;
    t_index m_rel_pidx;
    t_uindex m_ndesc;
    t_index m_tnid;
    t_uindex m_nchild;
};

PERSPECTIVE_EXPORT void fill_travnode(t_tvnode* node, bool expanded,
    t_uindex depth, t_uindex rel_pidx, t_uindex ndesc, t_uindex tnid);

struct PERSPECTIVE_EXPORT t_ftreenode {
    t_index m_idx;
    t_index m_fcidx;
    t_index m_nchild;
    t_depth m_depth;
};

// m_expanded == 0 indicates CLOSED, > 0 indicates OPEN
// contexts which are reporting full tree-expansion data directly case
// use == 1
// for OPEN (interior node) and == 2 for LE
struct PERSPECTIVE_EXPORT t_vdnode {
    t_vdnode();
    t_vdnode(bool expanded, t_depth depth);
    t_vdnode(t_index expanded, t_depth depth);
    t_vdnode(bool expanded, bool has_children);

    t_index m_expanded;
    t_depth m_depth;
    bool m_has_children;
};

} // end namespace perspective
