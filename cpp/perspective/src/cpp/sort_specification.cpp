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
#include <perspective/sort_specification.h>

namespace perspective {

t_sortspec::t_sortspec(
    const std::string& column_name, t_index agg_index, t_sorttype sort_type)
    : m_colname(column_name)
    , m_agg_index(agg_index)
    , m_sort_type(sort_type)
    , m_sortspec_type(SORTSPEC_TYPE_IDX) {}

t_sortspec::t_sortspec(t_index agg_index, t_sorttype sort_type)
    : m_agg_index(agg_index)
    , m_sort_type(sort_type)
    , m_sortspec_type(SORTSPEC_TYPE_IDX) {}

t_sortspec::t_sortspec(
    const std::vector<t_tscalar>& path, t_index agg_index, t_sorttype sort_type)
    : m_agg_index(agg_index)
    , m_sort_type(sort_type)
    , m_sortspec_type(SORTSPEC_TYPE_PATH)
    , m_path(path) {}

t_sortspec::t_sortspec()
    : m_agg_index(INVALID_INDEX)
    , m_sort_type(SORTTYPE_NONE)
    , m_sortspec_type(SORTSPEC_TYPE_IDX) {}

bool
t_sortspec::operator==(const t_sortspec& s2) const {
    return (m_agg_index == s2.m_agg_index) && (m_sort_type == s2.m_sort_type);
}

bool
t_sortspec::operator!=(const t_sortspec& s2) const {
    return !(*this == s2);
}

std::vector<t_sorttype>
get_sort_orders(const std::vector<t_sortspec>& vec) {
    if (vec.empty())
        return std::vector<t_sorttype>();
    auto num = vec.size();
    std::vector<t_sorttype> sort_orders(num);

    for (std::vector<t_sortspec>::size_type idx = 0; idx < num; ++idx) {
        sort_orders[idx] = vec[idx].m_sort_type;
    }
    return sort_orders;
}

} // end namespace perspective

namespace std {
PERSPECTIVE_EXPORT std::ostream&
operator<<(std::ostream& os, const perspective::t_sortspec& t) {
    using namespace perspective;
    os << "t_sortspec<idx: " << t.m_agg_index << " stype: " << t.m_sort_type
       << ">";
    return os;
}

} // end namespace std
