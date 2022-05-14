/******************************************************************************
 *
 * Copyright (c) 2020, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once
#ifdef PSP_ENABLE_PYTHON

#include <perspective/first.h>
#include <perspective/column.h>
#include <perspective/base.h>
#include <perspective/python/base.h>

namespace perspective {

// Specialize for PSP_OBJECT_TYPE
template <>
void t_column::object_copied<PSP_OBJECT_TYPE>(t_uindex idx) const;
template <>
void t_column::object_cleared<PSP_OBJECT_TYPE>(t_uindex idx) const;

} // namespace perspective

#endif