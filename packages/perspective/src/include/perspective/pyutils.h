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
#include <perspective/exports.h>

namespace perspective
{

t_bool curthread_has_gil();

// assumes caller owns the GIL
void print_python_stack();

PERSPECTIVE_EXPORT t_str repr(PyObject* pyo);

} // end namespace perspective