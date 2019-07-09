/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once

#include <perspective/first.h>
#include <perspective/config.h>
#include <perspective/raw_types.h>
#include <perspective/scalar.h>
#include <boost/optional.hpp>
#include <tuple>

namespace perspective {
struct t_view_config {
    t_view_config(std::vector<std::string> row_pivots, std::vector<std::string> column_pivots,
        std::vector<std::string> columns, std::map<std::string, std::string> aggregates,
        std::vector<std::tuple<std::string, std::string, t_tscalar>> filter,
        std::vector<std::vector<std::string>> sort, bool column_only);

    void add_filter_term(std::string col_name, std::string filter_op, t_tscalar filter_term);

    std::vector<std::string> m_row_pivots;
    std::vector<std::string> m_column_pivots;
    std::vector<std::string> m_columns;
    std::map<std::string, std::string> m_aggregates;
    std::vector<std::tuple<std::string, std::string, t_tscalar>> m_filter;
    std::vector<std::vector<std::string>> m_sort;
    bool m_column_only;
};
} // namespace perspective