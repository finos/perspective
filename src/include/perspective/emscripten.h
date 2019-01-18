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
#include <random>
#include <cmath>
#include <sstream>
#include <perspective/sym_table.h>
#include <codecvt>

namespace perspective {
namespace binding {

// Date parsing
t_date jsdate_to_t_date(emscripten::val date);
emscripten::val t_date_to_jsdate(t_date date);

/**
 * Converts a scalar value to its JS representation.
 *
 * Params
 * ------
 * t_tscalar scalar
 *
 * Returns
 * -------
 * val
 */
template <>
emscripten::val scalar_to(const t_tscalar& scalar);
emscripten::val scalar_to_val(const t_tscalar& scalar);

template <>
emscripten::val scalar_vec_to(const std::vector<t_tscalar>& scalars, std::uint32_t idx);
emscripten::val scalar_vec_to_val(const std::vector<t_tscalar>& scalars, std::uint32_t idx);

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
emscripten::val get_data_js(T ctx, std::uint32_t start_row, std::uint32_t end_row, std::uint32_t start_col,
    std::uint32_t end_col);


}
}
