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
    t_schema_column(
        const t_str& tblname, const t_str& name, const t_str& altname, t_dtype dtype);

private:
    t_str m_tblname;
    t_str m_name;
    t_str m_altname;
    t_dtype m_dtype;
};

typedef std::vector<t_schema_column> t_scolvec;

} // end namespace perspective
