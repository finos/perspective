################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from random import random
from asyncio import Future

from ..core.exception import PerspectiveError
from .table_api import PerspectiveTableProxy
from .table_api import table as make_table
from .view_api import PerspectiveViewProxy


class PerspectiveClient(object):
    def __init__(self):
        """A base class for a Perspective client implementation that offers
        a fully async API through an event loop.

        Child classes must implement `send()`, which defines how a message
        should be delivered to the Perspective server implementation, as well
        as call `set_event_loop` in their `__init__()`.
        """
        self._msg_id = 0
        self._handlers = {}
        self._loop = None
        self._create_future = None

    def set_event_loop(self, loop):
        """Given an event loop, decide how to create a new `Future` object
        using the loop, and attach the loop to this client instance.

        Supported loops include `tornado.ioloop.IOLoop`, which implements a
        slightly different API for `Future` creation (which we try to detect),
        and the `asyncio` loop (and any loop that implements `create_future`).

        Args:
            loop: a reference to an event loop in the current thread.
        """
        if getattr(loop, "add_future", None):
            # Tornado IOLoop - we must manually create the future
            self._create_future = lambda: Future()
        elif getattr(loop, "create_future", None):
            self._create_future = loop.create_future
        else:
            raise AttributeError("Loop must implement `create_future` or `add_future`!")
        self._loop = loop

    def open_table(self, name):
        """Return a proxy Table to a `Table` hosted in a server somewhere."""
        return PerspectiveTableProxy(self, name)

    def open_view(self, name):
        """Return a proxy View to a `View` hosted in a server somewhere."""
        return PerspectiveViewProxy(self, name)

    def _handle(self, msg):
        """Given a response from the Perspective server, resolve the Future
        with the response or an exception."""
        if not msg.get("data"):
            return

        handler = self._handlers.get(msg["data"].get("id"))

        if handler:
            future = handler["future"]
            if msg["data"].get("error"):
                future.set_exception(PerspectiveError(msg["data"]["error"]))
            else:
                future.set_result(msg["data"]["data"])

            if not handler.get("keep_alive"):
                del self._handlers[msg["data"]["id"]]

    def send(self, msg):
        """Send the message to the Perspective server implementation - must be
        implemented by a child class."""
        raise NotImplementedError()

    def post(self, msg, future=None, keep_alive=False):
        """Given a message and an associated `Future` object, store the future
        and send the message to the server."""
        if self._loop is None:
            raise PerspectiveError("An event loop must be set on `PerspectiveClient`!")

        if future:
            self._msg_id += 1
            self._handlers[self._msg_id] = {
                "future": future,
                "keep_alive": keep_alive,
            }

        msg["id"] = self._msg_id

        self.send(msg)

    def table(self, data, index=None, limit=None, name=str(random())):
        """Create a new `Table` in the server implementation, and return
        a proxy to it."""
        return make_table(self, data, index, limit, name)

    def terminate():
        """Close the connection between the server and client. Must be
        implemented by child classes, although only as part of a public API
        as `terminate()` should only be called by the user."""
        raise NotImplementedError()
