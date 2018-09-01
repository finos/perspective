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
#include <perspective/exports.h>
#include <perspective/scalar.h>

namespace perspective
{

struct t_multisorter;

PERSPECTIVE_EXPORT void argsort(t_idxvec& output, const t_multisorter& sorter);

struct PERSPECTIVE_EXPORT t_argsort_comparator
{
    t_argsort_comparator(const t_tscalvec& v, const t_sorttype& sort_type);

    bool operator()(t_index a, t_index b) const;

    const t_tscalvec& m_v;
    t_sorttype m_sort_type;
};

PERSPECTIVE_EXPORT void simple_argsort(
    t_tscalvec& v, t_idxvec& output, const t_sorttype& sort_type);

} // namespace perspective
