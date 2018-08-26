/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#if defined(PSP_ENABLE_PYTHON)

#pragma once
#include <perspective/first.h>
#include <perspective/raw_types.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#define NO_IMPORT_ARRAY
#define PY_ARRAY_UNIQUE_SYMBOL _perspectiveNumpy


namespace perspective
{

np::dtype get_numpy_typenum_from_dtype(t_dtype dtype);

} // end namespace perspective

#endif
