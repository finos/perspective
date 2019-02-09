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

#include <vector>

namespace perspective {

struct PERSPECTIVE_EXPORT t_custom_column_recipe {
    t_custom_column_recipe() {}
    std::vector<std::string> m_icols;
    std::string m_ocol;
    std::string m_expr;
    std::vector<std::string> m_where_keys;
    std::vector<std::string> m_where_values;
    std::string m_base_case;
};

typedef std::vector<t_custom_column_recipe> t_custom_column_recipevec;

class PERSPECTIVE_EXPORT t_custom_column {
public:
    t_custom_column(const t_custom_column_recipe& ccr);
    t_custom_column(const std::vector<std::string>& icols, const std::string& ocol,
        const std::string& expr, const std::vector<std::string>& where_keys,
        const std::vector<std::string>& where_values, const std::string& base_case);

    std::string get_ocol() const;
    std::string get_expr() const;
    const std::vector<std::string>& get_icols() const;
    t_custom_column_recipe get_recipe() const;
    const std::vector<std::string>& get_where_keys() const;
    const std::vector<std::string>& get_where_values() const;
    const std::string& get_base_case() const;

private:
    std::vector<std::string> m_icols;
    std::string m_ocol;
    std::string m_expr;
    std::vector<std::string> m_where_keys;
    std::vector<std::string> m_where_values;
    std::string m_base_case;
};

} // end namespace perspective
