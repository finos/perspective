/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/min_max.h>

namespace perspective {

t_minmax::t_minmax()
    : m_min_count(0)
    , m_max_count(0) {
    m_min = mknone();
    m_max = mknone();
}

} // end namespace perspective

namespace std {
std::ostream&
operator<<(std::ostream& os, const perspective::t_minmax& mm) {
    os << "t_minmax<min=" << mm.m_min << ", mincount=" << mm.m_min_count << " max=" << mm.m_max
       << ", maxcount=" << mm.m_max_count << ">";
    return os;
}

} // end namespace std
