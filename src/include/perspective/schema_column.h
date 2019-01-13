/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <vector>

namespace perspective {

class t_schema_column {
    t_schema_column(const std::string& tblname, const std::string& name,
        const std::string& altname, t_dtype dtype);

private:
    std::string m_tblname;
    std::string m_name;
    std::string m_altname;
};

} // end namespace perspective
