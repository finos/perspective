/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/sparse_tree_node.h>

namespace perspective {

t_stnode::t_stnode(t_uindex idx, t_uindex pidx, const t_tscalar& value,
    std::uint8_t depth, const t_tscalar& sort_value, t_uindex nstrands,
    t_uindex aggidx)
    : m_idx(idx)
    , m_pidx(pidx)
    , m_depth(depth)
    , m_nstrands(nstrands)
    , m_aggidx(aggidx) {
    m_value.set(value);
    m_sort_value.set(sort_value);
}

t_stnode::t_stnode() {}

void
t_stnode::set_nstrands(t_index nstrands) {
    m_nstrands = nstrands;
}

void
t_stnode::set_sort_value(t_tscalar sv) {
    m_sort_value.set(sv);
}

t_stpkey::t_stpkey(t_uindex idx, t_tscalar pkey)
    : m_idx(idx)
    , m_pkey(pkey) {}

t_stpkey::t_stpkey() {}

t_stleaves::t_stleaves(t_uindex idx, t_uindex lfidx)
    : m_idx(idx)
    , m_lfidx(lfidx) {}

t_stleaves::t_stleaves() {}

t_cellinfo::t_cellinfo() {}

t_cellinfo::t_cellinfo(t_index idx, t_depth treenum, t_index agg_index,
    t_uindex ridx, t_uindex cidx)
    : m_idx(idx)
    , m_treenum(treenum)
    , m_agg_index(agg_index)
    , m_ridx(ridx)
    , m_cidx(cidx) {}

} // end namespace perspective

namespace std {
std::ostream&
operator<<(std::ostream& os, const perspective::t_stnode& node) {
    os << "t_stnode<"
       << "idx: " << node.m_idx << " pidx: " << node.m_pidx
       << " value: " << node.m_value << " sort_value: " << node.m_sort_value
       << " aggidx: " << node.m_aggidx << " nstrands: " << node.m_nstrands
       << " depth: " << static_cast<perspective::t_uindex>(node.m_depth) << ">";
    return os;
}

std::ostream&
operator<<(std::ostream& os, const perspective::t_cellinfo& node) {
    os << "t_cellinfo<idx: " << node.m_idx << " treenum: " << node.m_treenum
       << " aggidx: " << node.m_agg_index << ">";
    return os;
}
} // namespace std
