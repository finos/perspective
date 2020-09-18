################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import json
from tornado import gen, ioloop
from tornado.websocket import websocket_connect
from ..client import PerspectiveClient
from ..manager.manager_internal import DateTimeEncoder


@gen.coroutine
def websocket(url, ioloop=ioloop.IOLoop.current()):
    """Create a new websocket client at the given `url`, using the given
    `ioloop` instance, which defaults to ioloop.IOLoop.current() if
    not provided by the user."""
    client = PerspectiveTornadoClient(url, ioloop)
    yield client._connect()
    raise gen.Return(client)


class PerspectiveTornadoClient(PerspectiveClient):

    # Send a heartbeat every 15 seconds
    HEARTBEAT_TIMEOUT = 15 * 1000

    def __init__(self, url, ioloop):
        """Create a `PerspectiveTornadoClient` that interfaces with a
        Perspective server over a Websocket. This class should not be
        initialized directly - use `perspective.tornado_client.websocket`."""
        super(PerspectiveTornadoClient, self).__init__()
        self._url = url
        self._ws = None
        self._pending_arrow = None
        self._pending_port_id = None

        # TODO: needs a cleaner API - if we give it an asyncio loop, will
        # Periodic callback still run?
        self.set_event_loop(ioloop)

    @gen.coroutine
    def _send_heartbeat(self):
        """Send a heartbeat message to the server's Websocket, which will
        respond with `heartbeat`."""
        yield self.send("heartbeat")

    @gen.coroutine
    def _connect(self):
        """Connect to the remote websocket, and send the `init` message to
        assert that the Websocket is alive and accepting connections."""
        self._ws = yield websocket_connect(
            self._url, on_message_callback=self.on_message
        )

        yield self.send({"id": -1, "cmd": "init"})

        # Send a `heartbeat` message every 15 seconds.
        _heartbeat_callback = ioloop.PeriodicCallback(
            self._send_heartbeat,
            callback_time=PerspectiveTornadoClient.HEARTBEAT_TIMEOUT,
        )

        _heartbeat_callback.start()

    def on_message(self, msg):
        """When a message is received, send it to the `_handle` method, or
        await the incoming arrow from the server."""
        if msg == "heartbeat":
            # Do not respond to server heartbeats - only send them
            return

        if self._pending_arrow is not None:
            result = {"data": {"id": self._pending_arrow, "data": msg}}

            if self._pending_port_id is not None:
                result["data"]["data"] = {
                    "port_id": self._pending_port_id,
                    "delta": msg,
                }

            self._handle(result)
            self._pending_arrow = None
            self._pending_port_id = None
        else:
            msg = json.loads(msg)

            if msg.get("is_transferable"):
                self._pending_arrow = msg["id"]

                if msg.get("data") and msg["data"].get("port_id", None) is not None:
                    self._pending_port_id = msg["data"].get("port_id")
            else:
                self._handle({"data": msg})

    @gen.coroutine
    def send(self, msg):
        """Send a message to the Websocket endpoint."""
        if (
            isinstance(msg, dict)
            and msg.get("args")
            and len(msg["args"]) > 0
            and isinstance(msg["args"][0], (bytes, bytearray))
        ):
            msg["is_transferable"] = True
            pre_msg = msg
            arrow = pre_msg["args"].pop(0)

            # tornado_handler expects the first arg to be an empty object,
            # which is the result of stringifying an ArrayBuffer in JS - add
            # an empty dict here so we don't break compatibility.
            pre_msg["args"].insert(0, {})

            # Must be received in order - for some reason if we yield sending
            # the pre-message, other messages are sent in its place which
            # breaks the expectation that the next message is an arrow.
            self._ws.write_message(json.dumps(pre_msg, cls=DateTimeEncoder))
            yield self._ws.write_message(arrow, binary=True)
        else:
            yield self._ws.write_message(json.dumps(msg, cls=DateTimeEncoder))

    def terminate(self):
        """Close the websocket client connection."""
        self._ws.close()
