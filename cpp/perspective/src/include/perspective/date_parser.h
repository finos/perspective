/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <chrono>
#include <perspective/base.h>
#include <perspective/first.h>
#include <perspective/exports.h>

namespace perspective {

struct PERSPECTIVE_EXPORT t_date_parser {
    /**
     * Given a string that is assumed to be a valid date/datetime,
     * parse it and return a `std::chrono::system_clock::time_point` object 
     * that represents number of milliseconds since epoch. 
     */
    static std::chrono::system_clock::time_point parse(const std::string& datestring);

    /**
     * Given a string that is assumed to be a valid date/datetime,
     * parse it and return `t_dtype::DTYPE_DATE` or `t_dtype::DTYPE_TIME`.
     * 
     * If the string is not a valid datetime, return `t_dtype::DTYPE_STR`.
     */
    static t_dtype format(const std::string& datestring);

    static const std::string VALID_FORMATS[12];
};
} // end namespace perspective