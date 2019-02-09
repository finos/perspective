/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/histogram.h>

namespace perspective {
t_hist_bucket::t_hist_bucket(t_tscalar begin, t_tscalar end, t_uindex count)
    : m_begin(begin)
    , m_end(end)
    , m_count(count) {}

t_hist_bucket::t_hist_bucket()
    : m_count(0) {}

t_histogram::t_histogram() {}

t_histogram::t_histogram(t_uindex nbuckets)
    : m_buckets(std::vector<t_hist_bucket>(nbuckets)) {}

} // end namespace perspective
