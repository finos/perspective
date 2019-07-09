/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/view_config.h>

namespace perspective {

t_view_config::t_view_config(std::vector<std::string> row_pivots,
    std::vector<std::string> column_pivots, std::vector<std::string> columns,
    std::map<std::string, std::string> aggregates,
    std::vector<std::tuple<std::string, std::string, t_tscalar>> filter,
    std::vector<std::vector<std::string>> sort, bool column_only)
    : m_row_pivots(row_pivots)
    , m_column_pivots(column_pivots)
    , m_columns(columns)
    , m_aggregates(aggregates)
    , m_filter(filter)
    , m_sort(sort)
    , m_column_only(column_only) {}

void
t_view_config::add_filter_term(
    std::string col_name, std::string filter_op, t_tscalar filter_term) {
    auto term = std::make_tuple(col_name, filter_op, filter_term);
    m_filter.push_back(term);
}

} // namespace perspective