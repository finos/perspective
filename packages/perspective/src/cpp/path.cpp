/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/path.h>

namespace perspective
{
t_path::t_path() {}

t_path::t_path(const t_tscalvec& path)
    : m_path(path)
{
}

const t_tscalvec&
t_path::path() const
{
    return m_path;
}

t_tscalvec&
t_path::path()
{
    return m_path;
}

} // namespace perspective
