/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#if defined(PSP_ENABLE_PYTHON)

#include <perspective/first.h>

#define PY_ARRAY_UNIQUE_SYMBOL _perspectiveNumpy
#include <numpy/arrayobject.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <perspective/numpy.h>
#include <perspective/raw_types.h>

namespace py = boost::python;
namespace np = boost::python::numpy;

extern "C" {
void PERSPECTIVE_EXPORT
perspective_import_numpy()
{
    _import_array();
}
}

namespace perspective
{

np::dtype
get_numpy_typenum_from_dtype(t_dtype dtype)
{
    switch (dtype)
    {
        case DTYPE_INT8:
        {
            return np::dtype::get_builtin<std::int8_t>();
        }
        case DTYPE_UINT8:
        {
            return np::dtype::get_builtin<std::uint8_t>();
        }
        case DTYPE_INT16:
        {
            return np::dtype::get_builtin<std::int16_t>();
        }
        case DTYPE_UINT16:
        {
            return np::dtype::get_builtin<std::uint16_t>();
        }
        case DTYPE_INT32:
        {
            return np::dtype::get_builtin<std::int32_t>();
        }
        case DTYPE_UINT32:
        {
            return np::dtype::get_builtin<std::uint32_t>();
        }
        case DTYPE_UINT64:
        {
            return np::dtype::get_builtin<std::uint64_t>();
        }
        case DTYPE_INT64:
        {
            return np::dtype::get_builtin<std::int64_t>();
        }
        case DTYPE_FLOAT32:
        {
            return np::dtype::get_builtin<float>();
        }
        case DTYPE_FLOAT64:
        {
            return np::dtype::get_builtin<double>();
        }
        // TODO
        // case DTYPE_STR:
        // {
        //     return np::dtype::get_builtin<t_str>();
        // }
        // case DTYPE_TIME:
        // {
        //     return NPY_DATETIME;
        // }
        // case DTYPE_DATE:
        // {
        //     return NPY_UINT32;
        // }
        case DTYPE_BOOL:
        {
            return np::dtype::get_builtin<bool>();
        }
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Invalid type encountered");
            return np::dtype::get_builtin<double>();
        }
    }
    return np::dtype::get_builtin<double>();
}
}

#endif