# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import six
import time
import numpy as np
import pandas as pd
from datetime import datetime
from pytest import fixture


def _make_date_time_index(size, time_unit):
    return pd.date_range("2000-01-01", periods=size, freq=time_unit)


def _make_period_index(size, time_unit):
    return pd.period_range(start="2000", periods=size, freq=time_unit)


def _make_dataframe(index, size=10):
    '''Create a new random dataframe of `size` and with a DateTimeIndex of frequency `time_unit`.'''
    return pd.DataFrame(index=index, data={
        "a": np.random.rand(size),
        "b": np.random.rand(size),
        "c": np.random.rand(size),
        "d": np.random.rand(size)
    })


class Util:
    @staticmethod
    def to_timestamp(obj):
        '''Return an integer timestamp based on a date/datetime object.'''
        classname = obj.__class__.__name__
        if classname == "date":
            if six.PY2:
                return int((time.mktime(obj.timetuple()) / 1000000.0))
            else:
                return datetime(obj.year, obj.month, obj.day).timestamp()
        elif classname == "datetime":
            if six.PY2:
                return int((time.mktime(obj.timetuple()) + obj.microsecond / 1000000.0))
            else:
                return obj.timestamp()
        else:
            return -1

    @staticmethod
    def make_dataframe(size=10, freq="D"):
        index = _make_date_time_index(size, freq)
        return _make_dataframe(index, size)

    @staticmethod
    def make_period_dataframe(size=10):
        index = _make_period_index(size, "M")
        return _make_dataframe(index, size)

    @staticmethod
    def make_series(size=10, freq="D"):
        index = _make_date_time_index(size, freq)
        return pd.Series(data=np.random.rand(size), index=index)


class Sentinel(object):
    '''Generic sentinel class for testing side-effectful code in Python 2 and 3.'''

    def __init__(self, value):
        self.value = value

    def get(self):
        return self.value

    def set(self, new_value):
        self.value = new_value


@fixture()
def sentinel():
    '''Pass `sentinel` into a test and call it with `value` to create a new instance of the Sentinel class.

    Example:
        >>> def test_with_sentinel(self, sentinel):
        >>>    s = sentinel(True)
        >>>    s.set(False)
        >>>    s.get()  # returns False
    '''
    def _sentinel(value):
        return Sentinel(value)
    return _sentinel


@fixture
def util():
    '''Pass the `Util` class in to a test.'''
    return Util
