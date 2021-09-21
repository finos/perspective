/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/dense_nodes.h>

namespace std {

std::ostream&
operator<<(std::ostream& os, const perspective::t_dense_tnode& s) {
    std::cout << "t_dtnode<idx:" << s.m_idx << " pidx:" << s.m_pidx
              << " fcidx:" << s.m_fcidx << " nchild:" << s.m_nchild
              << " flidx:" << s.m_flidx << " nleaves:" << s.m_nleaves << ">";
    return os;
}
} // namespace std
namespace perspective {

void
fill_dense_tnode(t_dense_tnode* node, t_uindex idx, t_uindex pidx,
    t_uindex fcidx, t_uindex nchild, t_uindex flidx, t_uindex nleaves) {
    node->m_idx = idx;
    node->m_pidx = pidx;
    node->m_fcidx = fcidx;
    node->m_nchild = nchild;
    node->m_flidx = flidx;
    node->m_nleaves = nleaves;
}
} // namespace perspective
