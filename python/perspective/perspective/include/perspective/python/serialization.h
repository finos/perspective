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

namespace perspective {
namespace binding {
    /******************************************************************************
     *
     * Data serialization
     */

    template <>
    t_val get_column_data(
        std::shared_ptr<t_data_table> table, const std::string& colname);

    template <typename CTX_T>
    std::shared_ptr<t_data_slice<CTX_T>> get_data_slice(
        std::shared_ptr<View<CTX_T>> view, std::uint32_t start_row,
        std::uint32_t end_row, std::uint32_t start_col, std::uint32_t end_col);

    std::shared_ptr<t_data_slice<t_ctxunit>> get_data_slice_unit(
        std::shared_ptr<View<t_ctxunit>> view, std::uint32_t start_row,
        std::uint32_t end_row, std::uint32_t start_col, std::uint32_t end_col);

    std::shared_ptr<t_data_slice<t_ctx0>> get_data_slice_ctx0(
        std::shared_ptr<View<t_ctx0>> view, std::uint32_t start_row,
        std::uint32_t end_row, std::uint32_t start_col, std::uint32_t end_col);

    std::shared_ptr<t_data_slice<t_ctx1>> get_data_slice_ctx1(
        std::shared_ptr<View<t_ctx1>> view, std::uint32_t start_row,
        std::uint32_t end_row, std::uint32_t start_col, std::uint32_t end_col);

    std::shared_ptr<t_data_slice<t_ctx2>> get_data_slice_ctx2(
        std::shared_ptr<View<t_ctx2>> view, std::uint32_t start_row,
        std::uint32_t end_row, std::uint32_t start_col, std::uint32_t end_col);

    template <typename CTX_T>
    t_val get_from_data_slice(std::shared_ptr<t_data_slice<CTX_T>> data_slice,
        t_uindex ridx, t_uindex cidx);
    t_val get_from_data_slice_unit(
        std::shared_ptr<t_data_slice<t_ctxunit>> data_slice, t_uindex ridx,
        t_uindex cidx);
    t_val get_from_data_slice_ctx0(
        std::shared_ptr<t_data_slice<t_ctx0>> data_slice, t_uindex ridx,
        t_uindex cidx);
    t_val get_from_data_slice_ctx1(
        std::shared_ptr<t_data_slice<t_ctx1>> data_slice, t_uindex ridx,
        t_uindex cidx);
    t_val get_from_data_slice_ctx2(
        std::shared_ptr<t_data_slice<t_ctx2>> data_slice, t_uindex ridx,
        t_uindex cidx);

    // wrap `get_pkeys` in order to convert t_scalar to t_val entirely within
    // c++
    template <typename CTX_T>
    std::vector<t_val> get_pkeys_from_data_slice(
        std::shared_ptr<t_data_slice<CTX_T>> data_slice, t_uindex ridx,
        t_uindex cidx);
    std::vector<t_val> get_pkeys_from_data_slice_unit(
        std::shared_ptr<t_data_slice<t_ctxunit>> data_slice, t_uindex ridx,
        t_uindex cidx);
    std::vector<t_val> get_pkeys_from_data_slice_ctx0(
        std::shared_ptr<t_data_slice<t_ctx0>> data_slice, t_uindex ridx,
        t_uindex cidx);
    std::vector<t_val> get_pkeys_from_data_slice_ctx1(
        std::shared_ptr<t_data_slice<t_ctx1>> data_slice, t_uindex ridx,
        t_uindex cidx);
    std::vector<t_val> get_pkeys_from_data_slice_ctx2(
        std::shared_ptr<t_data_slice<t_ctx2>> data_slice, t_uindex ridx,
        t_uindex cidx);

} // end namespace binding
} // end namespace perspective

#endif