# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


class _PerspectiveStateManager(object):

    TO_PROCESS = {}

    @classmethod
    def set_process(cls, pool, table_id):
        raise NotImplementedError(
                "`set_process()` must be implemented by the caller, " +
                "regardless of whether an event loop is present.")

    @classmethod
    def clear_process(cls, table_id):
        """Given a table_id, find the corresponding pool and call `process()`
        on it.

        Args:
            table_id (:obj`int`): The unique ID of the Table
        """
        pool = cls.TO_PROCESS.get(table_id, None)
        if pool is not None:
            pool._process()
            cls.reset_process(table_id)

    @classmethod
    def reset_process(cls, table_id):
        """Remove a pool from the execution cache, indicating that it should no
        longer be operated on.

        Args:
            table_id (:obj`int`): The unique ID of the Table
        """
        cls.TO_PROCESS.pop(table_id, None)

    @classmethod
    def _set_process_immediate(cls, pool, table_id):
        """Immediately execute `clear_process` on the pool as soon
        as it is registered with the manager.

        This is the default implementation of `set_process` for environments
        without an event loop.

        Args:
            pool (:obj`libbinding.t_pool`): A `t_pool` object
            table_id (:obj`int`): The unique ID of the Table
        """
        if table_id not in cls.TO_PROCESS:
            cls.TO_PROCESS[table_id] = pool
            cls.clear_process(table_id)
