# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from pytest import fixture


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
