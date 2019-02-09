/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/custom_column.h>

namespace perspective {

t_custom_column::t_custom_column(const t_custom_column_recipe& ccr)
    : m_icols(ccr.m_icols)
    , m_ocol(ccr.m_ocol)
    , m_expr(ccr.m_expr)
    , m_where_keys(ccr.m_where_keys)
    , m_where_values(ccr.m_where_values)
    , m_base_case(ccr.m_base_case)

{}

t_custom_column::t_custom_column(const std::vector<std::string>& icols, const std::string& ocol,
    const std::string& expr, const std::vector<std::string>& where_keys,
    const std::vector<std::string>& where_values, const std::string& base_case)
    : m_icols(icols)
    , m_ocol(ocol)
    , m_expr(expr)
    , m_where_keys(where_keys)
    , m_where_values(where_values)
    , m_base_case(base_case) {}

std::string
t_custom_column::get_ocol() const {
    return m_ocol;
}

std::string
t_custom_column::get_expr() const {
    return m_expr;
}

const std::vector<std::string>&
t_custom_column::get_icols() const {
    return m_icols;
}

t_custom_column_recipe
t_custom_column::get_recipe() const {
    t_custom_column_recipe rv;
    rv.m_icols = m_icols;
    rv.m_ocol = m_ocol;
    rv.m_expr = m_expr;
    rv.m_where_keys = m_where_keys;
    rv.m_where_values = m_where_values;
    rv.m_base_case = m_base_case;
    return rv;
}

const std::vector<std::string>&
t_custom_column::get_where_keys() const {
    return m_where_keys;
}

const std::vector<std::string>&
t_custom_column::get_where_values() const {
    return m_where_values;
}

const std::string&
t_custom_column::get_base_case() const {
    return m_base_case;
}

} // namespace perspective
