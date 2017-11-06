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
#include <perspective/raw_types.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#define NO_IMPORT_ARRAY
#define PY_ARRAY_UNIQUE_SYMBOL _perspectiveNumpy
#include <numpy/arrayobject.h>

namespace perspective
{
PERSPECTIVE_EXPORT t_dtype get_dtype_from_numpy(t_uindex ndtype);
t_dtype get_dtype_from_numpy(PyArrayObject* arr);
t_int32 get_numpy_typenum_from_dtype(t_dtype dtype);
} // end namespace perspective
