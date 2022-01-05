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

#include <cmath>
#include <chrono>
#include <pybind11/chrono.h>
#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python/base.h>

namespace perspective {
namespace binding {

    /******************************************************************************
     *
     * Helper functions
     */
    template <typename... Args>
    static void
    WARN(Args&&... args) {
        py::module::import("logging").attr("warning")(args...);
    };

    template <typename... Args>
    static void
    CRITICAL(Args&&... args) {
        py::module::import("logging").attr("critical")(args...);
    };

    static bool
    IS_BOOL(t_val&& type_instance) {
        return type_instance.is(py::module::import("builtins").attr("bool"));
    };
    static bool
    IS_INT(t_val&& type_instance) {
        return type_instance.is(py::module::import("builtins").attr("int"));
    };
    static bool
    IS_FLOAT(t_val&& type_instance) {
        return type_instance.is(py::module::import("builtins").attr("float"));
    };
    static bool
    IS_STR(t_val&& type_instance) {
        return type_instance.is(py::module::import("builtins").attr("str"));
    };
    static bool
    IS_BYTES(t_val&& type_instance) {
        return type_instance.is(py::module::import("builtins").attr("bytes"));
    };

    /******************************************************************************
     *
     * Date Parsing
     */

    t_dtype type_string_to_t_dtype(std::string type, std::string name = "");
    t_dtype type_string_to_t_dtype(py::str type, py::str name = "");

    t_val scalar_to_py(const t_tscalar& scalar, bool cast_double = false,
        bool cast_string = false);

} // namespace binding
} // namespace perspective

#endif