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
#include <perspective/python/base.h>
#include <perspective/python/utils.h>

namespace perspective {
namespace binding {

    /******************************************************************************
     *
     * Data accessor API
     */

    std::vector<std::string> get_column_names(t_val data, std::int32_t format);
    t_dtype infer_type(t_val x, t_val date_validator);
    t_dtype get_data_type(
        t_val data, std::int32_t format, py::str name, t_val date_validator);
    std::vector<t_dtype> get_data_types(t_val data, std::int32_t format,
        std::vector<std::string> names, t_val date_validator);

} // namespace binding
} // namespace perspective

#endif