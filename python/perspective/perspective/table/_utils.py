################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from datetime import date, datetime
from .libbinding import t_dtype


def _extract_type(type, typemap):
    rval = typemap.get(type)

    if rval is None:
        raise KeyError("unsupported type: {}".format(type))

    return rval


def _dtype_to_pythontype(dtype):
    '''Returns the native Python type from a Perspective type'''
    mapping = {
        t_dtype.DTYPE_BOOL: bool,
        t_dtype.DTYPE_FLOAT32: float,
        t_dtype.DTYPE_FLOAT64: float,
        t_dtype.DTYPE_INT8: int,
        t_dtype.DTYPE_INT16: int,
        t_dtype.DTYPE_INT32: int,
        t_dtype.DTYPE_INT64: int,
        t_dtype.DTYPE_DATE: date,
        t_dtype.DTYPE_TIME: datetime,
        t_dtype.DTYPE_STR: str,
        t_dtype.DTYPE_OBJECT: object,
    }

    return _extract_type(dtype, mapping)


def _dtype_to_str(dtype):
    '''Returns the normalized string representation of a Perspective type,
    compatible with Perspective.js.
    '''
    mapping = {
        t_dtype.DTYPE_BOOL: "boolean",
        t_dtype.DTYPE_FLOAT32: "float",
        t_dtype.DTYPE_FLOAT64: "float",
        t_dtype.DTYPE_INT8: "integer",
        t_dtype.DTYPE_INT16: "integer",
        t_dtype.DTYPE_INT32: "integer",
        t_dtype.DTYPE_INT64: "integer",
        t_dtype.DTYPE_DATE: "date",
        t_dtype.DTYPE_TIME: "datetime",
        t_dtype.DTYPE_STR: "string",
        t_dtype.DTYPE_OBJECT: "object"
    }

    return _extract_type(dtype, mapping)


def _str_to_pythontype(typestring):
    '''Returns a Python type from the normalized string representation of a
    Perspective type, i.e. from Perspective.js
    '''
    mapping = {
        "boolean": bool,
        "float": float,
        "integer": int,
        "date": date,
        "datetime": datetime,
        "string": str,
        "object": object,
    }

    return _extract_type(typestring, mapping)
