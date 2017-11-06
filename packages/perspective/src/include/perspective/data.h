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

struct PERSPECTIVE_EXPORT t_data
{
    t_data();
    t_data(const t_tscalvec& data);

    const t_tscalvec& data() const;
    t_tscalvec& data();
    t_tscalvec m_data;
};

typedef std::vector<t_data> t_datavec;

} // end namespace perspective
