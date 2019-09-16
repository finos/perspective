/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <memory>
#include <locale>
#include <perspective/base.h>
#include <perspective/first.h>
#include <perspective/exports.h>

namespace perspective {

class PERSPECTIVE_EXPORT t_date_parser {
public:
    t_date_parser();

    bool is_valid(std::string const& datestring);

private:
    static const std::string VALID_FORMATS[12];
};
} // end namespace perspective