# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import six
import numpy as np
import pandas as pd
from datetime import datetime

DATE_DTYPES = [np.dtype("datetime64[D]"), np.dtype("datetime64[W]"), np.dtype("datetime64[M]"), np.dtype("datetime64[Y]")]


def deconstruct_numpy(array):
    '''Given a numpy array, parse it and return the data as well as a numpy array of null indices.

    Args:
        array (numpy.array)

    Returns:
        dict : `array` is the original array, and `mask` is an array of booleans where `True` represents a nan/None value.
    '''
    is_object_or_string = pd.api.types.is_object_dtype(array.dtype) or pd.api.types.is_string_dtype(array.dtype)

    # use `isnull` or `isnan` depending on dtype
    if is_object_or_string or six.PY2:
        # python3 masked_invalid compares datetimes, but not in python2
        data = array
        mask = np.argwhere(pd.isnull(array)).flatten()
    else:
        masked = np.ma.masked_invalid(array)
        data = masked.data
        mask = np.argwhere(masked.mask).flatten()

    if data.dtype == bool or data.dtype == "?":
        # bool => byte
        data = data.astype("b", copy=False)
    elif np.issubdtype(data.dtype, np.datetime64):
        # treat days/weeks/months/years as datetime objects - avoid idiosyncracy with days of month, etc.
        if data.dtype in DATE_DTYPES:
            data = data.astype(datetime)

        # cast datetimes to millisecond timestamps
        # because datetime64("nat") is a double, cast to float64 here - C++ handles the rest
        if data.dtype == np.dtype("datetime64[us]"):
            data = data.astype(np.float64, copy=False) / 1000
        elif data.dtype == np.dtype("datetime64[ns]"):
            data = data.astype(np.float64, copy=False) / 1000000
        elif data.dtype == np.dtype("datetime64[ms]"):
            data = data.astype(np.float64, copy=False)
        elif data.dtype == np.dtype("datetime64[s]"):
            data = data.astype(np.float64, copy=False) * 1000
        elif data.dtype == np.dtype("datetime64[m]"):
            data = data.astype(np.float64, copy=False) * 60000
        elif data.dtype == np.dtype("datetime64[h]"):
            data = data.astype(np.float64, copy=False) * 3600000
    elif np.issubdtype(data.dtype, np.timedelta64):
        data = data.astype(np.float64, copy=False)

    return {
            "array": data,
            "mask": mask
        }
