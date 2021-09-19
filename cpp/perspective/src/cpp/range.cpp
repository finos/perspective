/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/range.h>

namespace perspective {

t_range::t_range(t_uindex bridx, t_uindex eridx)
    : m_bridx(bridx)
    , m_eridx(eridx)
    , m_mode(RANGE_ROW) {}

t_range::t_range(t_uindex bridx, t_uindex eridx, t_uindex bcidx, t_uindex ecidx)
    : m_bridx(bridx)
    , m_eridx(eridx)
    , m_bcidx(bcidx)
    , m_ecidx(ecidx)
    , m_mode(RANGE_ROW_COLUMN) {}

t_range::t_range()
    : m_mode(RANGE_ALL) {}

t_range::t_range(
    const std::vector<t_tscalar>& brpath, const std::vector<t_tscalar>& erpath)
    : m_brpath(brpath)
    , m_erpath(erpath)
    , m_mode(RANGE_ROW_PATH) {}

t_range::t_range(const std::vector<t_tscalar>& brpath,
    const std::vector<t_tscalar>& erpath, const std::vector<t_tscalar>& bcpath,
    const std::vector<t_tscalar>& ecpath) {}

t_range::t_range(const std::string& expr_name) {}

t_uindex
t_range::bridx() const {
    return m_bridx;
}

t_uindex
t_range::eridx() const {
    return m_eridx;
}

t_uindex
t_range::bcidx() const {
    return m_bcidx;
}

t_uindex
t_range::ecidx() const {
    return m_ecidx;
}

t_range_mode
t_range::get_mode() const {
    return m_mode;
}

} // end namespace perspective