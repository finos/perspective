/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/date_parser.h>

namespace perspective {

// Milliseconds & timezones are not currently handled
const std::string t_date_parser::VALID_FORMATS[12]
    = {"%Y%m%dT%H%M%S", // ISO "%Y%m%dT%H%M%S%F%q"
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",     // ISO extended
        "%A, %d %b %Y %H:%M:%S", // RFC 0822
        "%Y-%m-%d\\%H:%M:%S"
        "%m-%d-%Y",
        "%m/%d/%Y", "%m-%d-%Y", "%m %d %Y", "%m/%d/%Y", "%m/%d/%y", "%d %m %Y"};

std::chrono::system_clock::time_point
t_date_parser::parse(const std::string& datestring) {
    return std::chrono::system_clock::now();
}

t_dtype
t_date_parser::format(const std::string& datestring) {
    return t_dtype::DTYPE_STR;
}
} // end namespace perspective