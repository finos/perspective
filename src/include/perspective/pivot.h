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

namespace perspective {

struct PERSPECTIVE_EXPORT t_pivot_recipe {
    t_pivot_recipe() {}
    std::string m_colname;
    std::string m_name;
    t_pivot_mode m_mode;
};

class PERSPECTIVE_EXPORT t_pivot {
public:
    t_pivot(const t_pivot_recipe& r);
    t_pivot(const std::string& column);
    t_pivot(const std::string& column, t_pivot_mode mode);

    const std::string& name() const;
    const std::string& colname() const;

    t_pivot_mode mode() const;

    t_pivot_recipe get_recipe() const;

private:
    std::string m_colname;
    std::string m_name;
    t_pivot_mode m_mode;
};

} // namespace perspective
