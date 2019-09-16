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
// https://github.com/pybind/pybind11/issues/1598
// no global py::objects
static auto WARN = [](auto&&... args) { py::module::import("logging").attr("warning")(args...);};
static auto CRITICAL = [](auto&&... args) { py::module::import("logging").attr("critical")(args...);};
static auto IS_BOOL = [](auto type_instance) { return type_instance.is(py::module::import("builtins").attr("bool")); };
static auto IS_INT = [](auto type_instance) { return type_instance.is(py::module::import("builtins").attr("int")); };
static auto IS_FLOAT = [](auto type_instance) { return type_instance.is(py::module::import("builtins").attr("float")); };
static auto IS_STR = [](auto type_instance) { return type_instance.is(py::module::import("builtins").attr("str")); };
static auto IS_BYTES = [](auto type_instance) { return type_instance.is(py::module::import("builtins").attr("bytes")); };

/******************************************************************************
 *
 * Date Parsing
 */
t_date pythondate_to_t_date(t_val date);
std::int64_t pythondatetime_to_ms(t_val datetime);

t_dtype type_string_to_t_dtype(std::string type, std::string name = "");
t_dtype type_string_to_t_dtype(py::str type, py::str name = "");

t_val scalar_to_py(const t_tscalar& scalar, bool cast_double = false, bool cast_string = false);

} //namespace binding
} //namespace perspective

#endif