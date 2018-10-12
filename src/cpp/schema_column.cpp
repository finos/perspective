/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/schema_column.h>

namespace perspective {

t_schema_column::t_schema_column(
    const t_str& tblname, const t_str& name, const t_str& altname, t_dtype dtype)
    : m_tblname(tblname)
    , m_name(name)
    , m_altname(altname)
    , m_dtype(dtype) {}
} // namespace perspective
