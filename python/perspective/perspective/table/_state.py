# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

TO_PROCESS = {}


def set_process(pool, table_id):
    """Queue a call to `process` and immediately execute it.

    This is the default behavior for Perspective runtimes that are not running within
    an event loop. If running within Tornado or IPyWidgets, `PerspectiveTornadoHandler`
    and `PerspectiveWidget` provide their own event loop hook-ins for the runtime.
    """
    if table_id not in TO_PROCESS:
        TO_PROCESS[table_id] = pool
        clear_process(table_id)


def clear_process(table_id):
    """Given a table_id, find the corresponding pool and call `process()` on it."""
    pool = TO_PROCESS.get(table_id, None)
    if pool is not None:
        pool._process()
        reset_process(table_id)


def reset_process(table_id):
    """Remove a pool from the execution cache, indicating that it should no
    longer be operated on.
    """
    TO_PROCESS.pop(table_id, None)


"""
def clear_process(method):
    '''Call `process()` before the execution of the decorated method.'''
    def wrapper(*args, **kwargs):
        caller = *args[0]
        table_id = caller._table_id
        pool = TO_PROCESS.get(table_id, None)
        if pool is not None:
            pool._process()
            TO_PROCESS.pop(table_id)
        return method(*args, **kwargs)
    return wrapper


def reset_process(method):
    '''Remove the pool from the cache before the execution of the decorated method.'''
    def wrapper(*args, **kwargs):
        caller = *args[0]
        table_id = caller._table_id
        TO_PROCESS.pop(table_id)
        return method(*args, **kwargs)
    return wrapper
"""
