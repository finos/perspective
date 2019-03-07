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
#include <perspective/exports.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/gnode.h>
#include <perspective/pool.h>
#include <perspective/config.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/data_slice.h>
#include <cstddef>
#include <memory>
#include <map>

namespace perspective {

template <typename CTX_T>
class PERSPECTIVE_EXPORT View {
public:
    View(t_pool* pool, std::shared_ptr<CTX_T> ctx, std::shared_ptr<t_gnode> gnode,
        std::string name, std::string separator, t_config config);

    ~View();

    std::int32_t sides() const;
    std::int32_t num_rows() const;
    std::int32_t num_columns() const;

    std::map<std::string, std::string> schema() const;
    std::vector<std::string> _column_names(bool skip = false, std::int32_t depth = 0) const;

    // Pivot table operations
    std::int32_t get_row_expanded(std::int32_t idx) const;
    t_index expand(std::int32_t idx, std::int32_t row_pivot_length);
    t_index collapse(std::int32_t idx);
    void set_depth(std::int32_t depth, std::int32_t row_pivot_length);

    // Data serialization
    std::shared_ptr<t_data_slice<CTX_T>> get_data(
        t_index start_row, t_index end_row, t_index start_col, t_index end_col);

    // Getters
    std::shared_ptr<CTX_T> get_context() const;
    std::vector<std::string> get_row_pivots() const;
    std::vector<std::string> get_column_pivots() const;
    std::vector<t_aggspec> get_aggregates() const;
    std::vector<t_fterm> get_filters() const;
    std::vector<t_sortspec> get_sorts() const;
    std::vector<t_tscalar> get_row_path(t_uindex idx) const;
    t_stepdelta get_step_delta(t_index bidx, t_index eidx) const;
    bool is_column_only() const;

private:
    std::string _map_aggregate_types(
        const std::string& name, const std::string& typestring) const;

    t_pool* m_pool;
    std::shared_ptr<CTX_T> m_ctx;
    std::shared_ptr<t_gnode> m_gnode;
    std::string m_name;
    std::string m_separator;

    std::vector<std::string> m_row_pivots;
    std::vector<std::string> m_column_pivots;
    std::vector<t_aggspec> m_aggregates;
    std::vector<t_fterm> m_filters;
    std::vector<t_sortspec> m_sorts;
    bool m_column_only;

    t_config m_config;
};
} // end namespace perspective