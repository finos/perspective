# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


class _PerspectiveStateManager(object):

    TO_PROCESS = {}

    def set_process(pool, table_id):
        raise NotImplementedError(
                "`set_process()` must be implemented by the caller, " +
                "regardless of whether an event loop is present.")

    def clear_process(table_id):
        """Given a table_id, find the corresponding pool and call `process()`
        on it.

        Args:
            table_id (:obj`int`): The unique ID of the Table
        """
        pool = _PerspectiveStateManager.TO_PROCESS.get(table_id, None)
        if pool is not None:
            pool._process()
            _PerspectiveStateManager.reset_process(table_id)

    def reset_process(table_id):
        """Remove a pool from the execution cache, indicating that it should no
        longer be operated on.

        Args:
            table_id (:obj`int`): The unique ID of the Table
        """
        _PerspectiveStateManager.TO_PROCESS.pop(table_id, None)

    def _set_process_immediate(pool, table_id):
        """Immediately execute `clear_process` on the pool as soon
        as it is registered with the manager.

        This is the default implementation of `set_process` for environments
        without an event loop.

        Args:
            pool (:obj`libbinding.t_pool`): A `t_pool` object
            table_id (:obj`int`): The unique ID of the Table
        """
        if table_id not in _PerspectiveStateManager.TO_PROCESS:
            _PerspectiveStateManager.TO_PROCESS[table_id] = pool
            _PerspectiveStateManager.clear_process(table_id)


"""
def clear_process(method):
    '''Call `process()` before the execution of the decorated method.'''
    def wrapper(self, *args, **kwargs):
        table_id = self._table_id
        pool = TO_PROCESS.get(table_id, None)
        if pool is not None:
            pool._process()
            TO_PROCESS.pop(table_id)
        return method(*args, **kwargs)
    return wrapper

def run_then_process(method):
    pass

def process_then_run(method):
    pass

def reset_process(method):
    '''Remove the pool from the cache before the execution of the decorated method.'''
    def wrapper(self, *args, **kwargs):
        table_id = self._table_id
        TO_PROCESS.pop(table_id)
        return method(*args, **kwargs)
    return wrapper
"""
