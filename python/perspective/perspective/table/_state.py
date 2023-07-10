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


class _PerspectiveStateManager(object):
    """Internal state management class that controls when `_process` is called
    within the C++ Table internals.

    `_process()` notifies the engine to clear its queue of pending updates to be
    applied and reconciled. When Perspective runs within an event loop, we
    should use the loop whenever possible to batch calls to `_process()`.
    Callers that have access to an event loop implementation should set
    `queue_process` to their own function with `table_id` and `state_manager` as
    positional arguments.

    Override functions must be bound to this instance using `functools.partial`,
    i.e.: `functools.partial(queue_process_custom,
    state_manager=table._state_manager)

    The guarantee of `queue_process` is that `call_process` will be called,
    either on the next iteration of the event loop or before output is generated
    (through a serialization method, for example).

    Though each :obj:`~perspective.Table` contains a separate instance of the
    state manager, `TO_PROCESS`, which contains the `t_pool` objects for pending
    `_process` calls, is shared amongst all instances of the state manager.
    """

    TO_PROCESS = {}

    def __init__(self):
        """Create a new instance of the state manager, and enable the default behavior
        of calling `_process()` synchronously.

        New instances of :obj:`_PerspectiveStateManager` have no awareness of whether
        an event loop is present - the instance's `queue_process` method must be
        overridden.
        """
        self.queue_process = self._queue_process_immediate

    def set_process(self, pool, table_id):
        """Queue a `_process` call on the specified pool and table ID.

        Checks whether a `_process()` call has been queued already for the specified
        table, and calls `queue_process`, which MUST be implemented by the caller.

        Args:
            pool (:obj`libpsppy.t_pool`): a `t_pool` object
            table_id (:obj`int`): a unique ID for the Table
        """
        if table_id not in _PerspectiveStateManager.TO_PROCESS:
            _PerspectiveStateManager.TO_PROCESS[table_id] = pool
            self.queue_process(table_id)

    def call_process(self, table_id):
        """Given a table_id, find the corresponding pool and call `process()`
        on it, which takes all the updates that have been queued, applies each
        update to the global Table state, and then clears the queue.

        Args:
            table_id (:obj`int`): The unique ID of the Table
        """
        pool = _PerspectiveStateManager.TO_PROCESS.pop(table_id, None)
        if pool is not None:
            pool._process()

    def remove_process(self, table_id):
        """Remove a pool from the execution cache, indicating that it should no
        longer be operated on.

        Args:
            table_id (:obj`int`): The unique ID of the Table
        """
        _PerspectiveStateManager.TO_PROCESS.pop(table_id, None)

    def _queue_process_immediate(self, table_id):
        """Immediately execute `call_process` on the pool as soon
        as `queue_process` is called.

        This is the default implementation of `queue_process` for environments
        without an event loop, meaning that calls to :obj:`~perspective.Table`'s
        `update()` method are immediately followed by a call to `_process`.

        Args:
            table_id (:obj`int`): The unique ID of the Table
        """
        self.call_process(table_id)
