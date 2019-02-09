/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/data.h>

namespace perspective {
t_data::t_data() {}

t_data::t_data(const std::vector<t_tscalar>& data)
    : m_data(data) {}

const std::vector<t_tscalar>&
t_data::data() const {
    return m_data;
}

std::vector<t_tscalar>&
t_data::data() {
    return m_data;
}
} // namespace perspective
