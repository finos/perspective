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
#include <perspective/raw_types.h>
#include <perspective/exports.h>

namespace perspective
{

struct PERSPECTIVE_EXPORT t_pivot_recipe
{
    t_pivot_recipe() {}
    t_str m_colname;
    t_str m_name;
    t_pivot_mode m_mode;
};

typedef std::vector<t_pivot_recipe> t_pivot_recipevec;

class PERSPECTIVE_EXPORT t_pivot
{
public:
    t_pivot(const t_pivot_recipe& r);
    t_pivot(const t_str& column);
    t_pivot(const t_str& column, t_pivot_mode mode);

    const t_str& name() const;
    const t_str& colname() const;

    t_pivot_mode mode() const;

    t_pivot_recipe get_recipe() const;

private:
    t_str m_colname;
    t_str m_name;
    t_pivot_mode m_mode;
};

typedef std::vector<t_pivot> t_pivotvec;
} // namespace perspective
