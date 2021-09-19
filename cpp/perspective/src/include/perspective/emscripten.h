/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once

#include <perspective/binding.h>
#include <boost/optional.hpp>
#include <emscripten.h>
#include <emscripten/bind.h>

#ifdef PSP_ENABLE_WASM
#include <emscripten/val.h>
// for WASM builds, typedef all data structures for binding languages to
// emscripten::val
typedef t_val t_data_accessor;
typedef emscripten::val t_val;
#endif

namespace perspective {
namespace binding {
    /**
     * @brief Helper function for creating `std::vector`s for use in Javascript.
     *
     * @tparam T
     * @return std::vector<T>
     */
    template <typename T>
    std::vector<T> make_vector();

    /**
     * @brief namespace `js_typed_array` contains utility bindings that
     * initialize typed arrays using Emscripten.
     *
     */
    namespace js_typed_array {} // namespace js_typed_array

    /**
     * @brief Given a vector of scalar data objects, write it into a typed
     * array.
     *
     * @tparam T
     * @tparam T
     * @tparam T
     */
    template <typename T, typename F = T, typename O = T>
    t_val col_to_typed_array(const std::vector<t_tscalar>& data);

    // Date parsing
    t_date jsdate_to_t_date(t_val date);
    t_val t_date_to_jsdate(t_date date);

    template <>
    t_val scalar_to(const t_tscalar& scalar);
    t_val scalar_to_val(const t_tscalar& scalar, bool cast_double = false,
        bool cast_string = false);
} // namespace binding
} // namespace perspective
