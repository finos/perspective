#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

from datetime import datetime

import numpy as np

DATE_DTYPES = [
    np.dtype("datetime64[D]"),
    np.dtype("datetime64[W]"),
    np.dtype("datetime64[M]"),
    np.dtype("datetime64[Y]"),
]


def make_null_mask(array):
    """Given a numpy array, return a numpy array of int64s containing the
    indices of `array` where the value is either invalid or null.

    Invalid values are:
        - None
        - numpy.nat
        - numpy.nan

    Args:
        array (:obj:`numpy.array`)
    """
    mask = []

    is_object_or_string_dtype = np.issubdtype(array.dtype, np.str_) or np.issubdtype(array.dtype, np.object_)

    is_datetime_dtype = np.issubdtype(array.dtype, np.datetime64) or np.issubdtype(array.dtype, np.timedelta64)

    for i, item in enumerate(array):
        invalid = item is None

        if not is_object_or_string_dtype:
            if is_datetime_dtype:
                invalid = invalid or str(item) == "NaT"
            else:
                invalid = invalid or np.isnan(item)

        if invalid:
            mask.append(i)

    return mask


def deconstruct_numpy(array, mask=None):
    """Given a numpy array, parse it and return the data as well as a numpy
    array of null indices.

    Args:
        array (:obj:`numpy.array`)

    Keyword Args:
        mask (:obj:`numpy.array`)

    Returns:
        (:obj:`dict`): `array` is the original array, and `mask` is an array of
            booleans where `True` represents a nan/None value.
    """
    if mask is None:
        mask = make_null_mask(array)

    if array.dtype == bool or array.dtype == "?":
        # bool => byte
        array = array.astype("b", copy=False)
    elif np.issubdtype(array.dtype, np.datetime64):
        # treat days/weeks/months/years as datetime objects - avoid idiosyncracy
        # with days of month, etc.
        if array.dtype in DATE_DTYPES:
            array = array.astype(datetime)

        # cast datetimes to millisecond timestamps
        # because datetime64("nat") is a double, cast to float64 here - C++
        # handles the rest
        if array.dtype == np.dtype("datetime64[us]"):
            array = array.astype(np.float64, copy=False) / 1000
        elif array.dtype == np.dtype("datetime64[ns]"):
            array = array.astype(np.float64, copy=False) / 1000000
        elif array.dtype == np.dtype("datetime64[ms]"):
            array = array.astype(np.float64, copy=False)
        elif array.dtype == np.dtype("datetime64[s]"):
            array = array.astype(np.float64, copy=False) * 1000
        elif array.dtype == np.dtype("datetime64[m]"):
            array = array.astype(np.float64, copy=False) * 60000
        elif array.dtype == np.dtype("datetime64[h]"):
            array = array.astype(np.float64, copy=False) * 3600000
    elif np.issubdtype(array.dtype, np.timedelta64):
        array = array.astype(np.float64, copy=False)

    return {"array": array, "mask": mask}
