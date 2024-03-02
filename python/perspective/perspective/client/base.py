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

import asyncio

from random import random

from ..core.exception import PerspectiveError
from .table_api import PerspectiveTableProxy
from .table_api import table as make_table
from .view_api import PerspectiveViewProxy


class PerspectiveClient(object):
    def __init__(self):
        """A base class for a Perspective client implementation that offers
        a fully async API through an event loop.

        Child classes must implement `send()`, which defines how a message
        should be delivered to the Perspective server implementation.
        """
        self._msg_id = 0
        self._handlers = {}

        # Because we can't reuse a `Future` in Python, we can't just resolve
        # the same `Future` over and over again in order to actually execute
        # on_update/on_delete etc. callbacks.
        #
        # Instead, we store the callbacks on the client and use `callback_id`
        # to access callback references. `self._callback_cache` is a map of
        # callbacks to integer IDs, which is required to allow the `remove_{}`
        # APIs to receive a callable to remove.
        #
        # To execute the callbacks themselves, we can look up the callback
        # in `self._callback_id_cache` (a dict of integer ID to callback),
        # and execute it in the `_handle` method.
        self._callback_cache = {}
        self._callback_id_cache = {}
        self._callback_id = 0

    def open_table(self, name):
        """Return a proxy Table to a `Table` hosted in a server somewhere."""
        return PerspectiveTableProxy(self, name)

    def _handle(self, msg):
        """Given a response from the Perspective server, resolve the Future
        with the response or an exception."""
        if not msg.get("data"):
            return

        handler = self._handlers.get(msg["data"].get("id"))
        if handler:
            future = handler.get("future", None)
            keep_alive = handler.get("keep_alive", False)

            if keep_alive and handler.get("callback_id"):
                # Must look up callback function and execute it, and then
                # return without re-setting the result of the Future.
                callback = self._callback_id_cache.get(handler["callback_id"])
                data = msg["data"]["data"]
                if data and isinstance(data, dict):
                    callback(**data)
                elif data:
                    callback(data)
                else:
                    callback()
                return
            elif future:
                if msg["data"].get("error"):
                    future.set_exception(PerspectiveError(msg["data"]["error"]))
                else:
                    cmd = handler.get("cmd", None)

                    if cmd == "view":
                        future.set_result(PerspectiveViewProxy(self, msg["data"]["data"]))
                    elif cmd == "table":
                        future.set_result(PerspectiveTableProxy(self, msg["data"]["data"]))
                    else:
                        future.set_result(msg["data"]["data"])

            if not keep_alive:
                del self._handlers[msg["data"]["id"]]

    def send(self, msg):
        """Send the message to the Perspective server implementation - must be
        implemented by a child class."""
        raise NotImplementedError()

    def get_hosted_table_names(self):
        msg = {"cmd": "get_hosted_table_names"}
        future = asyncio.Future()
        self.post(msg, future=future)
        return future

    def post(self, msg, future=None, keep_alive=False):
        """Given a message and an associated `Future` object, store the future
        and send the message to the server."""
        self._msg_id += 1

        if future:
            handler = {
                "future": future,
            }

            # Handle table and view case here, because we can't reliably set
            # a custom resolve handler like we can do in JS.
            cmd = msg.get("cmd", None)

            if cmd == "view" or cmd == "table":
                handler["cmd"] = cmd

            self._handlers[self._msg_id] = handler
        elif keep_alive:
            handler = {
                "keep_alive": keep_alive,
            }

            if msg.get("callback_id"):
                handler["callback_id"] = msg["callback_id"]

            self._handlers[self._msg_id] = handler

        msg["id"] = self._msg_id

        return asyncio.ensure_future(self.send(msg))

    def table(self, data, index=None, limit=None, name=None):
        """Create a new `Table` in the server implementation, and return
        a proxy to it."""
        name = name or str(random())
        return make_table(self, data, name, index, limit)

    def terminate():
        """Close the connection between the server and client. Must be
        implemented by child classes, although only as part of a public API
        as `terminate()` should only be called by the user."""
        raise NotImplementedError()
