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
from ..table.view import View
from .session import PerspectiveSession
from .manager_internal import _PerspectiveManagerInternal


def gen_name(size=10, chars=string.ascii_uppercase + string.digits):
    return "".join(random.choice(chars) for x in range(size))


class PerspectiveManager(_PerspectiveManagerInternal):
    '''PerspectiveManager is an orchestrator for running Perspective on the
    server side.

    The core functionality resides in `process()`, which receives
    JSON-serialized messages from a client (implemented by `perspective-viewer`
    in the browser), executes the commands in the message, and returns the
    results of those commands back to the `post_callback`. Table/View instances
    should be passed to the manager using `host_table` or `host_view` - this
    allows server code to call Table/View APIs natively instead of proxying
    them through the Manager. Because Perspective is designed to be used in a
    shared context, i.e. multiple clients all accessing the same `Table`,
    PerspectiveManager comes with the context of `sessions` - an
    encapsulation of the actions and resources used by a single connection
    to Perspective, which can be cleaned up after the connection is closed.

    - When a client connects, for example through a websocket, a new session
        should be spawned using `new_session()`.
    - When the websocket closes, call `close()` on the session instance to
        clean up associated resources.
    '''

    def __init__(self, lock=False):
        super(PerspectiveManager, self).__init__(lock=lock)

    def lock(self):
        """Block messages that can mutate the state of :obj:`~perspective.Table`
         and :obj:`~perspective.View` objects under management.

        All ``PerspectiveManager`` objects exposed over the internet should be
        locked to prevent content from being mutated by clients.
        """
        self._lock = True

    def unlock(self):
        """Unblock messages that can mutate the state of
        :obj:`~perspective.Table` and :obj:`~perspective.View` objects under
        management."""
        self._lock = False

    def host(self, item, name=None):
        """Given a :obj:`~perspective.Table` or :obj:`~perspective.View`,
        place it under management and allow operations on it to be passed
        through the Manager instance.

        Args:
            table_or_view (:obj:`~perspective.Table`/:obj:`~perspective.View`) :
                a Table or View to be managed.

        Keyword Args:
            name (:obj:`str`) : an optional name to allow retrieval through
                ``get_table`` or ``get_view``. A name will be generated if not
                provided.
        """
        name = name or gen_name()
        if isinstance(item, Table):
            self.host_table(name, item)
        elif isinstance(item, View):
            self.host_view(name, item)
        else:
            raise PerspectiveError(
                "Only `Table()` and `View()` instances can be hosted.")

    def host_table(self, name, table):
        '''Given a reference to a `Table`, manage it and allow operations on it
        to occur through the Manager.

        If a function for `queue_process` is defined (i.e., by
        :obj:`~perspective.PerspectiveTornadoHandler`), bind the function to
        :obj:`~perspective.Table` and have it call the manager's version of
        `queue_process`.
        '''
        if self._queue_process_callback is not None:
            # always bind the callback to the table's state manager
            table._state_manager.queue_process = partial(
                self._queue_process_callback, state_manager=table._state_manager)
        self._tables[name] = table
        return name

    def host_view(self, name, view):
        '''Given a :obj:`~perspective.View`, add it to the manager's views
        container.
        '''
        self._views[name] = view

    def get_table(self, name):
        '''Return a table under management by name.'''
        return self._tables.get(name, None)

    def get_view(self, name):
        '''Return a view under management by name.'''
        return self._views.get(name, None)

    def new_session(self):
        return PerspectiveSession(self)

    def _set_queue_process(self, func):
        """For each table under management, bind :obj:`func` to the table's state
        manager and to run whenever ``queue_process`` is called.

        After this method is called, future Tables hosted on this manager
        instance will call the same ``queue_process`` callback.
        """
        self._queue_process_callback = func
        for table in self._tables.values():
            table._state_manager.queue_process = partial(
                self._queue_process_callback, state_manager=table._state_manager)
