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
#include <perspective/base.h>
#include <perspective/scalar.h>
#include <perspective/exports.h>

namespace perspective {

// Represents a min/ max value per column/aggregate
struct PERSPECTIVE_EXPORT t_minmax {

    t_minmax();

    t_index m_min_count;
    t_index m_max_count;
    t_tscalar m_min;
    t_tscalar m_max;
};

} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_minmax& mm);
} // end namespace std
