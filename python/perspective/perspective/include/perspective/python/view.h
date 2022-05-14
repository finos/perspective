/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once
#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/pyutils.h>
#include <perspective/python/base.h>
#include <perspective/python/utils.h>

#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

namespace perspective {
namespace binding {

    /******************************************************************************
     *
     * View API
     */

    template <>
    bool is_valid_filter(
        t_dtype type, t_val date_parser, t_filter_op comp, t_val filter_term);

    template <>
    std::tuple<std::string, std::string, std::vector<t_tscalar>>
    make_filter_term(t_dtype column_type, t_val date_parser,
        const std::string& column_name, const std::string& filter_op_str,
        t_val filter_term);

    template <>
    std::shared_ptr<t_view_config> make_view_config(const t_gnode& gnode,
        std::shared_ptr<t_schema> schema, t_val date_parser, t_val config);

    template <typename CTX_T>
    std::shared_ptr<View<CTX_T>> make_view(std::shared_ptr<Table> table,
        const std::string& name, const std::string& separator,
        t_val view_config, t_val date_parser);

    /**
     * Unlike Emscripten, where we can define templated headers in the Embind
     * declaration, we need to explicitly specify all templated functions
     * before they are used by Pybind.
     */
    std::shared_ptr<View<t_ctxunit>> make_view_unit(
        std::shared_ptr<Table> table, std::string name, std::string separator,
        t_val view_config, t_val date_parser);
    std::shared_ptr<View<t_ctx0>> make_view_ctx0(std::shared_ptr<Table> table,
        std::string name, std::string separator, t_val view_config,
        t_val date_parser);
    std::shared_ptr<View<t_ctx1>> make_view_ctx1(std::shared_ptr<Table> table,
        std::string name, std::string separator, t_val view_config,
        t_val date_parser);
    std::shared_ptr<View<t_ctx2>> make_view_ctx2(std::shared_ptr<Table> table,
        std::string name, std::string separator, t_val view_config,
        t_val date_parser);

    py::bytes to_arrow_unit(std::shared_ptr<View<t_ctxunit>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    py::bytes to_arrow_zero(std::shared_ptr<View<t_ctx0>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    py::bytes to_arrow_one(std::shared_ptr<View<t_ctx1>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    py::bytes to_arrow_two(std::shared_ptr<View<t_ctx2>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    std::string to_csv_unit(std::shared_ptr<View<t_ctxunit>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    std::string to_csv_zero(std::shared_ptr<View<t_ctx0>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    std::string to_csv_one(std::shared_ptr<View<t_ctx1>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    std::string to_csv_two(std::shared_ptr<View<t_ctx2>> view,
        std::int32_t start_row, std::int32_t end_row, std::int32_t start_col,
        std::int32_t end_col);

    py::bytes get_row_delta_unit(std::shared_ptr<View<t_ctxunit>> view);
    py::bytes get_row_delta_zero(std::shared_ptr<View<t_ctx0>> view);
    py::bytes get_row_delta_one(std::shared_ptr<View<t_ctx1>> view);
    py::bytes get_row_delta_two(std::shared_ptr<View<t_ctx2>> view);

} // namespace binding
} // namespace perspective

#endif