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
#include <perspective/scalar.h>
#include <perspective/exports.h>

namespace perspective {

struct PERSPECTIVE_EXPORT t_hist_bucket {
    t_hist_bucket(t_tscalar begin, t_tscalar end, t_uindex count);
    t_hist_bucket();

    t_tscalar m_begin;
    t_tscalar m_end;
    t_uindex m_count;
};

struct PERSPECTIVE_EXPORT t_histogram {

    t_histogram();
    t_histogram(t_uindex nbuckets);

    std::vector<t_hist_bucket> m_buckets;
};

} // end namespace perspective
