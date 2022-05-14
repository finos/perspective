/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <functional>
#include <perspective/arg_sort.h>
#include <perspective/multi_sort.h>
#include <perspective/scalar.h>

namespace perspective {

void
argsort(std::vector<t_index>& output, const t_multisorter& sorter) {
    if (output.empty())
        return;
    // Output should be the same size is v
    for (t_index i = 0, loop_end = output.size(); i != loop_end; ++i)
        output[i] = i;
    std::sort(output.begin(), output.end(), sorter);
}

t_argsort_comparator::t_argsort_comparator(
    const std::vector<t_tscalar>& v, const t_sorttype& sort_type)
    : m_v(v)
    , m_sort_type(sort_type) {}

bool
t_argsort_comparator::operator()(t_index a, t_index b) const {
    const t_tscalar& first = m_v[a];
    const t_tscalar& second = m_v[b];

    switch (m_sort_type) {
        case SORTTYPE_ASCENDING: {
            return (first < second);
        } break;
        case SORTTYPE_DESCENDING: {
            return (first > second);
        } break;
        case SORTTYPE_ASCENDING_ABS: {
            return std::abs(first.to_double()) < std::abs(second.to_double());
        } break;
        case SORTTYPE_DESCENDING_ABS: {

            return std::abs(first.to_double()) > std::abs(second.to_double());
        } break;
        case SORTTYPE_NONE: {
            return a < b;
        }
    }

    return a < b;
}

void
simple_argsort(std::vector<t_tscalar>& v, std::vector<t_index>& output,
    const t_sorttype& sort_type) {
    // Output should be the same size is v
    for (t_index i = 0, loop_end = output.size(); i != loop_end; ++i)
        output[i] = i;
    t_argsort_comparator cmp(v, sort_type);

    std::sort(output.begin(), output.end(), cmp);
}

} // namespace perspective
