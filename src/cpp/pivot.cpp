/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/pivot.h>
#include <sstream>

namespace perspective {

t_pivot::t_pivot(const t_pivot_recipe& r) {
    m_colname = r.m_colname;
    m_name = r.m_name;
    m_mode = r.m_mode;
}

t_pivot::t_pivot(const std::string& colname)
    : m_colname(colname)
    , m_name(colname)
    , m_mode(PIVOT_MODE_NORMAL) {}

t_pivot::t_pivot(const std::string& colname, t_pivot_mode mode)
    : m_colname(colname)
    , m_name(colname)
    , m_mode(mode) {}

const std::string&
t_pivot::name() const {
    return m_name;
}

const std::string&
t_pivot::colname() const {
    return m_colname;
}

t_pivot_mode
t_pivot::mode() const {
    return m_mode;
}

t_pivot_recipe
t_pivot::get_recipe() const {
    t_pivot_recipe rv;
    rv.m_colname = m_colname;
    rv.m_name = m_name;
    rv.m_mode = m_mode;
    return rv;
}

} // end namespace perspective
