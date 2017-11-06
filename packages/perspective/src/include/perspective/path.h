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
#include <perspective/scalar.h>
#include <perspective/exports.h>
#include <vector>

namespace perspective
{

struct PERSPECTIVE_EXPORT t_path
{
    t_path();
    t_path(const t_tscalvec& path);

    const t_tscalvec& path() const;
    t_tscalvec& path();
    t_tscalvec m_path;
};

typedef std::vector<t_path> t_pathvec;

} // end namespace perspective
