# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


def deconstruct_numpy(array):
    '''Given a numpy array, parse it and return the data as well as a numpy array of null indices.

    Args:
        array (numpy.array)

    Returns:
        dict : `array` is the original array, and `mask` is an array of booleans where `True` represents a nan/None value.
    '''
    import numpy as np

    # use `isnull` or `isnan` depending on dtype
    if array.dtype == object or array.dtype == str:
        import pandas as pd
        data = array
        mask = np.argwhere(pd.isnull(array)).flatten()
    else:
        masked = np.ma.masked_invalid(array)
        data = masked.data
        mask = np.argwhere(masked.mask).flatten()

    if array.dtype == bool or array.dtype == "?":
        # convert booleans to int
        data = data.view(dtype="int64")
    elif np.issubdtype(array.dtype, np.datetime64):
        # convert datetimes to milliseconds from nanoseconds
        data = data.view(dtype="datetime64[ns]").view("int64") / 1000000000

    return {
            "array": data,
            "mask": mask
        }
