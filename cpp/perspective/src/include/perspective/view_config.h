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

    /**
     * @brief Add filter terms manually, as the filter term must be calculated from the value
     * passed through the binding.
     *
     * @param term
     */
    void add_filter_term(std::tuple<std::string, std::string, std::vector<t_tscalar>> term);

    std::vector<std::string> get_row_pivots();

    std::vector<std::string> get_column_pivots();

    /**
     * @brief Construct a vector of `t_aggspec` for use in the engine, where configs stored as
     * built-in types are not yet supported.
     *
     * @param schema
     * @return std::vector<t_aggspec>
     */
    std::vector<t_aggspec> get_aggregates(const t_schema& schema); // FIXME: reduce deps

    std::vector<std::string> get_columns();

    std::vector<t_fterm> get_filter();

    /**
     * @brief Return how the `View` should be sorted. The first member of the tuple is the
     * regular sort specification, and the second member is the column sort specification. //
     * FIXME: cleanup
     *
     * FIXME: what's the point of column sorts
     *
     * @param aggregate_names `t_sortspec` requires the aggregate index
     * @return std::tuple<std::vector<t_sortspec>, std::vector<t_sortspec>>
     */
    std::tuple<std::vector<t_sortspec>, std::vector<t_sortspec>> get_sort(
        const std::vector<std::string>& aggregate_names);

    // FIXME: we should not need this
    t_index get_aggregate_index(
        const std::vector<std::string>& agg_names, const std::string& column) const;

    // FIXME: we should not need this
    std::vector<std::string> get_aggregate_names(const std::vector<t_aggspec>& aggs) const;

    t_filter_op get_filter_op() const;
    bool is_column_only() const;

private:
    std::vector<std::string> m_row_pivots;
    std::vector<std::string> m_column_pivots;
    std::map<std::string, std::string> m_aggregates;
    std::vector<std::string> m_columns;
    std::vector<std::tuple<std::string, std::string, std::vector<t_tscalar>>> m_filter;
    std::vector<std::vector<std::string>> m_sort;

    /**
     * @brief If a `filter_op` is specified - TODO: finish
     *
     */
    std::string m_filter_op;

    /**
     * @brief should the `View` be `column_only`, that is, pivoted by 1+ columns without a row
     * pivot?
     *
     */
    bool m_column_only;
};
} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_view_config& vc);
} // end namespace std