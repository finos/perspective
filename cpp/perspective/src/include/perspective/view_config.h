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
#include <perspective/base.h>
#include <perspective/config.h>
#include <perspective/raw_types.h>
#include <perspective/scalar.h>
#include <boost/optional.hpp>
#include <tuple>

namespace perspective {

/**
 * @brief The `t_view_config` API provides a unified view configuration object, which specifies
 * how the `View` transforms the underlying `Table`. By storing configuration values in native
 * C++ types, we allow easy integration with binding languages.
 *
 */
class t_view_config {
public:
    /**
     * @brief Construct a `t_view_config` object.
     *
     * @param row_pivots
     * @param column_pivots
     * @param aggregates
     * @param columns
     * @param filter
     * @param sort
     */
    t_view_config(std::vector<std::string> row_pivots, std::vector<std::string> column_pivots,
        std::map<std::string, std::string> aggregates, std::vector<std::string> columns,
        std::vector<std::tuple<std::string, std::string, std::vector<t_tscalar>>> filter,
        std::vector<std::vector<std::string>> sort, std::string filter_op, bool column_only);

    void init(const t_schema& schema);

    /**
     * @brief Add filter terms manually, as the filter term must be calculated from the value
     * passed through the binding.
     *
     * @param term
     */
    void add_filter_term(std::tuple<std::string, std::string, std::vector<t_tscalar>> term);

    std::vector<std::string> get_row_pivots() const;

    std::vector<std::string> get_column_pivots() const;

    std::vector<t_aggspec> get_aggspecs() const;

    std::vector<std::string> get_columns() const;

    std::vector<t_fterm> get_fterm() const;

    std::vector<t_sortspec> get_sortspec() const;

    std::vector<t_sortspec> get_col_sortspec() const;

    t_filter_op get_filter_op() const;
    bool is_column_only() const;

private:
    std::vector<t_aggspec> make_aggspecs(const t_schema& schema);

    std::vector<t_fterm> make_fterm();

    std::tuple<std::vector<t_sortspec>, std::vector<t_sortspec>> make_sortspec();

    t_index get_aggregate_index(const std::string& column) const;

    std::vector<std::string> m_row_pivots;
    std::vector<std::string> m_column_pivots;
    std::map<std::string, std::string> m_aggregates;
    std::vector<std::string> m_columns;
    std::vector<std::tuple<std::string, std::string, std::vector<t_tscalar>>> m_filter;
    std::vector<std::vector<std::string>> m_sort;

    /**
     * @brief The ordered list of aggregate columns:
     *
     * 1. all columns marked as "shown" by the user in `m_columns`
     * 2. all specified aggregates from `m_aggregates`
     * 3. all "hidden sorts", i.e. columns to sort by that do not appear in `m_columns`
     *
     */
    std::vector<std::string> m_aggregate_names;
    std::string m_filter_op;
    bool m_column_only;

    // store abstractions, for now
    std::vector<t_aggspec> m_aggspecs;

    std::vector<t_fterm> m_fterm;

    std::vector<t_sortspec> m_sortspec;

    std::vector<t_sortspec> m_col_sortspec;
};
} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_view_config& vc);
} // end namespace std