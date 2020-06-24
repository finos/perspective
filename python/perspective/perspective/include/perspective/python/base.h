/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once
#ifdef PSP_ENABLE_PYTHON

/******************************************************************************
 *
 * Pybind includes
 */
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/stl_bind.h>
#include <pybind11/numpy.h>
#include <boost/optional.hpp>

/******************************************************************************
 *
 * Numpy includes
 */
#include <numpy/npy_math.h>

/******************************************************************************
 *
 * Pybind namespace
 */
using namespace perspective;
namespace py = pybind11;

/******************************************************************************
 *
 * Python typedefs
 */
typedef py::object t_val;
typedef t_val t_data_accessor;

#endif
