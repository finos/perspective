/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/gnode.h>
#include <perspective/table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/val.h>
#include <random>
#include <cmath>
#include <sstream>
#include <perspective/sym_table.h>
#include <codecvt>

namespace perspective {
namespace binding {

    // Date parsing
    t_date jsdate_to_t_date(t_val date);
    t_val t_date_to_jsdate(t_date date);

    /**
     * Converts a scalar value to its JS representation.
     *
     * Params
     * ------
     * t_tscalar scalar
     *
     * Returns
     * -------
     * t_val
     */
    template <>
    t_val scalar_to(const t_tscalar& scalar);
    t_val scalar_to_val(
        const t_tscalar& scalar, bool cast_double = false, bool cast_string = false);

    template <>
    t_val scalar_vec_to(const std::vector<t_tscalar>& scalars, std::uint32_t idx);
    t_val scalar_vec_to_val(const std::vector<t_tscalar>& scalars, std::uint32_t idx);

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    template <typename T>
    t_val get_data_js(T ctx, std::uint32_t start_row, std::uint32_t end_row,
        std::uint32_t start_col, std::uint32_t end_col);

} // namespace binding
} // namespace perspective
