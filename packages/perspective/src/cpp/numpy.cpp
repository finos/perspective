/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>

#define PY_ARRAY_UNIQUE_SYMBOL _perspectiveNumpy
#include <numpy/arrayobject.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <perspective/numpy.h>
#include <perspective/raw_types.h>

extern "C" {
void PERSPECTIVE_EXPORT
perspective_import_numpy()
{
    import_array();
}
}

namespace perspective
{

t_dtype
get_dtype_from_numpy(t_uindex ndtype)
{
    switch (ndtype)
    {
        case NPY_INT8:
        {
            return DTYPE_INT8;
        }
        case NPY_UINT8:
        {
            return DTYPE_UINT8;
        }
        case NPY_INT16:
        {
            return DTYPE_INT16;
        }
        case NPY_UINT16:
        {
            return DTYPE_UINT16;
        }
        case NPY_INT32:
        {
            return DTYPE_INT32;
        }
        case NPY_UINT32:
        {
            return DTYPE_UINT32;
        }
        case NPY_UINT64:
        {
            return DTYPE_UINT64;
        }
        case NPY_LONGLONG:
        {
            return DTYPE_INT64;
        }
        case NPY_FLOAT:
        {
            return DTYPE_FLOAT32;
        }
        case NPY_DOUBLE:
        {
            return DTYPE_FLOAT64;
        }
        case NPY_OBJECT:
        {
            return DTYPE_STR;
        }
        case NPY_DATETIME:
        {
            return DTYPE_TIME;
        }
        case NPY_BOOL:
        {
            return DTYPE_BOOL;
        }
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Invalid type encountered");
            return DTYPE_NONE;
        }
    }
    return DTYPE_NONE;
}

t_dtype
get_dtype_from_numpy(PyArrayObject* arr)
{
    PyArray_Descr* ndtype = PyArray_DESCR(arr);
    if (!ndtype)
    {
        PSP_COMPLAIN_AND_ABORT("Invalid type encountered");
    }

    return get_dtype_from_numpy(
        static_cast<t_uindex>(ndtype->type_num));
}

t_int32
get_numpy_typenum_from_dtype(t_dtype dtype)
{
    switch (dtype)
    {
        case DTYPE_INT8:
        {
            return NPY_INT8;
        }
        case DTYPE_UINT8:
        {
            return NPY_UINT8;
        }
        case DTYPE_INT16:
        {
            return NPY_INT16;
        }
        case DTYPE_UINT16:
        {
            return NPY_UINT16;
        }
        case DTYPE_INT32:
        {
            return NPY_INT32;
        }
        case DTYPE_UINT32:
        {
            return NPY_UINT32;
        }
        case DTYPE_UINT64:
        {
            return NPY_UINT64;
        }
        case DTYPE_INT64:
        {
            return NPY_LONGLONG;
        }
        case DTYPE_FLOAT32:
        {
            return NPY_FLOAT;
        }
        case DTYPE_FLOAT64:
        {
            return NPY_DOUBLE;
        }
        case DTYPE_STR:
        {
            return NPY_OBJECT;
        }
        case DTYPE_TIME:
        {
            return NPY_DATETIME;
        }
        case DTYPE_DATE:
        {
            return NPY_UINT32;
        }
        case DTYPE_BOOL:
        {
            return NPY_BOOL;
        }
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Invalid type encountered");
            return NPY_DOUBLE;
        }
    }
    return NPY_DOUBLE;
}
}
