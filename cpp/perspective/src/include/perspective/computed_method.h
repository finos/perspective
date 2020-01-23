/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <perspective/raw_types.h>
#include <perspective/scalar.h>
#include <boost/algorithm/string.hpp>
#include <type_traits>

namespace perspective {

/**
 * @brief The `computed_method` namespace contains all functions that will be
 * used to generate values for a computed column. Computed functions should
 * receive a parameter pack of `t_tscalar`s and return a `t_tscalar` value.
 * 
 */
namespace computed_method {
    
// Add
template <t_dtype T>
t_tscalar add_helper(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar add_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y);

t_tscalar add(t_tscalar x, t_tscalar y);

// Subtract

template <t_dtype T>
t_tscalar subtract_helper(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar subtract_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y);

t_tscalar subtract(t_tscalar x, t_tscalar y);

// Multiply

template <t_dtype T>
t_tscalar multiply_helper(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar multiply_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y);

t_tscalar multiply(t_tscalar x, t_tscalar y);

// Divide

template <t_dtype T>
t_tscalar divide_helper(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y);

template <>
t_tscalar divide_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y);

t_tscalar divide(t_tscalar x, t_tscalar y);

// Uppercase

t_tscalar uppercase(t_tscalar x);

} // end namespace computed_method
} // end namespace perspective