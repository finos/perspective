################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import random
import string
from functools import partial

from ..core.exception import PerspectiveError
from ..table import Table
from .manager_internal import _PerspectiveManagerInternal
from .session import PerspectiveSession


def gen_name(size=10, chars=string.ascii_uppercase + string.digits):
    return "".join(random.choice(chars) for x in range(size))


class PerspectiveManager(_PerspectiveManagerInternal):
    """PerspectiveManager is an orchestrator for running Perspective on the
    server side.

    The core functionality resides in `process()`, which receives
    JSON-serialized messages from a client (implemented by `perspective-viewer`
    in the browser), executes the commands in the message, and returns the
    results of those commands back to the `post_callback`. Table instances
    should be passed to the manager using `host_table` - this allows server
    code to call Table APIs natively instead of proxying them through the
    Manager. Because Perspective is designed to be used in a shared context,
    i.e. multiple clients all accessing the same `Table`, PerspectiveManager
    comes with the context of `sessions` - an encapsulation of the actions
    and resources used by a single connection to Perspective, which can be
    cleaned up after the connection is closed.

    - When a client connects, for example through a websocket, a new session
        should be spawned using `new_session()`.
    - When the websocket closes, call `close()` on the session instance to
        clean up associated resources.
    """

    def __init__(self, lock=False):
        """Create a new ``PerspectiveManager`` instance.

        Keyword Args:
            lock (:obj:`bool`): [description]. Defaults to False.
        """
        super(PerspectiveManager, self).__init__(lock=lock)
        self._loop_callback = None

    def lock(self):
        """Block messages that can mutate the state of :obj:`~perspective.Table`
        objects under management.

        All ``PerspectiveManager`` objects exposed over the internet should be
        locked to prevent content from being mutated by clients.
        """
        self._lock = True

    def unlock(self):
        """Unblock messages that can mutate the state of
        :obj:`~perspective.Table` objects under management."""
        self._lock = False

    def host(self, item, name=None):
        """Given a :obj:`~perspective.Table`, place it under management and
        allow operations on it to be passed through the Manager instance.

        Args:
            item (:obj:`~perspective.Table`) : a Table to be managed.

        Keyword Args:
            name (:obj:`str`) : an optional name to allow retrieval through
                ``get_table``. A name will be generated if not provided.
        """
        name = name or gen_name()
        if isinstance(item, Table):
            self.host_table(name, item)
        else:
            raise PerspectiveError("Only `Table()` instances can be hosted.")

    def host_table(self, name, table):
        """Given a reference to a `Table`, manage it and allow operations on it
        to occur through the Manager.

        If a function for `queue_process` is defined (i.e., by
        :obj:`~perspective.PerspectiveTornadoHandler`), bind the function to
        :obj:`~perspective.Table` and have it call the manager's version of
        `queue_process`.
        """
        if self._loop_callback is not None:
            # always bind the callback to the table's state manager
            self._loop_callback(lambda: table._table.get_pool().set_event_loop())
            table._state_manager.queue_process = partial(
                self._loop_callback, table._state_manager.call_process
            )
        self._tables[name] = table
        return name

    def get_table(self, name):
        """Return a table under management by name."""
        return self._tables.get(name, None)

    def get_table_names(self):
        """Return the tables that are hosted with this manager by name."""
        return list(self._tables.keys())

    def new_session(self):
        return PerspectiveSession(self)

    def call_loop(self, f, *args, **kwargs):
        """Calls `f()` on this `PerspectiveManager`'s event loop if it has one,
        or raise a PerspectiveError if there is no loop callback set using
        `set_loop_callback()`.
        """
        if self._loop_callback is None:
            raise PerspectiveError(
                "Event loop not set on this PerspectiveManager - use set_loop_callback() before calling call_loop()."
            )
        return self._loop_callback(f, *args, **kwargs)

    def set_loop_callback(self, loop_callback):
        """Sets this `PerspectiveManager` to run in Async mode, defering
        `update()` application and releasing the GIL for expensive operations.

        Once called, this `PerspectiveManager` and all Perspective objects it
        hosts must only be interacted with from the same thread.

        Args:
            loop_callback: A function which accepts a function reference and
                its args/kwargs, and schedules it to run on the same thread
                on which set_loop_callback()` was originally invoked.
        """
        if self._loop_callback is not None:
            raise PerspectiveError("PerspectiveManager already has a `loop_callback`")
        if not callable(loop_callback):
            raise PerspectiveError("`loop_callback` must be a function")
        self._loop_callback = loop_callback
        for table in self._tables.values():
            loop_callback(lambda: table._table.get_pool().set_event_loop())
            table._state_manager.queue_process = partial(
                loop_callback, table._state_manager.call_process
            )
