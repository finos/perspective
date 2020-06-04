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
        self._callbacks = [callback for callback in self._callbacks if condition(callback) is False]

    def pop_callbacks(self, callback_id):
        """Removes and returns a list of callbacks with the given
        `callback_id`.

        Args:
            callback_id (:obj:`str`) an id that identifies the callback.

        Returns:
            :obj:`list` a list of dicts containing the callbacks that were
                removed.
        """
        popped = []
        new_callbacks = []

        for callback in self._callbacks:
            if callback["callback_id"] == callback_id:
                popped.append(callback)
            else:
                new_callbacks.append(callback)

        return popped

    def get_callbacks(self):
        return self._callbacks

    def __iter__(self):
        return iter(self._callbacks)

    def __len__(self):
        return len(self._callbacks)

    def __repr__(self):
        return str(self._callbacks)
