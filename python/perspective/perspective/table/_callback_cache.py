################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


class _PerspectiveCallBackCache(object):
    def __init__(self):
        self._callbacks = []

    def add_callback(self, callback):
        self._callbacks.append(callback)

    def remove_callbacks(self, condition):
        '''Remove callback functions that satisfy the given condition.

        Args:
            condition (func): a function that returns either True or False. If
                True is returned, filter the item out.
        '''
        if not callable(condition):
            raise ValueError("callback filter condition must be a callable function!")
        self._callbacks = [callback for callback in self._callbacks if condition(callback) is True]

    def get_callbacks(self):
        return self._callbacks

    def __repr__(self):
        return str(self._callbacks)
