################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import asyncio
import json
from abc import ABC, abstractmethod

from .client import PerspectiveClient
from ..manager.manager_internal import DateTimeEncoder


class Periodic(ABC):
    def __init__(self, callback, interval):
        self._callback = callback
        self._interval = interval

    @abstractmethod
    async def start(self):
        ...

    @abstractmethod
    async def stop(self):
        ...


class PerspectiveWebsocketConnection(ABC):
    @abstractmethod
    async def connect(self, url, on_message, max_message_size) -> None:
        ...

    @abstractmethod
    def periodic(self, callback, interval) -> Periodic:
        ...

    @abstractmethod
    async def write(self, message, binary=False):
        ...

    @abstractmethod
    async def close(self):
        ...


class PerspectiveWebsocketClient(PerspectiveClient):

    # Ping the server every 30 seconds
    PING_TIMEOUT = 15 * 1000

    def __init__(self, websocket: PerspectiveWebsocketConnection):
        """Create a `PerspectiveWebsocketClient` that interfaces with a
        Perspective server over a Websocket"""
        super(PerspectiveWebsocketClient, self).__init__()

        self._websocket = websocket
        self._pending_binary = None
        self._pending_binary_length = 0
        self._pending_port_id = None
        self._full_binary = b""

    async def _send_ping(self):
        """Send a `ping` heartbeat message to the server's Websocket, which will
        respond with `pong`."""
        await self.send("ping")

    async def connect(self, url):
        """Connect to the remote websocket, and send the `init` message to
        assert that the Websocket is alive and accepting connections."""
        await self._websocket.connect(
            url,
            on_message=self.on_message,
            max_message_size=1024 * 1024 * 1024,
        )

        await self.send({"id": -1, "cmd": "init"})

        # Send a `ping` message every 15 seconds.
        self._ping_callback = self._websocket.periodic(
            self._send_ping,
            interval=self.PING_TIMEOUT,
        )

        await self._ping_callback.start()

    def on_message(self, msg):
        """When a message is received, send it to the `_handle` method, or
        await the incoming binary from the server."""
        if msg == "pong":
            # Do not respond to server pong heartbeats - only send them
            return

        if self._pending_binary is not None:
            binary_msg = msg

            self._full_binary += binary_msg

            if len(self._full_binary) == self._pending_binary_length:
                # Chunking is complete
                binary_msg = self._full_binary

            else:
                # Wait for the next chunk
                return

            result = {"data": {"id": self._pending_binary, "data": binary_msg}}

            if self._pending_port_id is not None:
                result["data"]["data"] = {
                    "port_id": self._pending_port_id,
                    "delta": binary_msg,
                }

            self._handle(result)

            # Clear flags for special binary message flow
            self._pending_binary = None
            self._pending_binary_length = None
            self._pending_port_id = None
            self._full_binary = b""

        elif isinstance(msg, str):
            msg = json.loads(msg)

            if msg.get("binary_length"):
                self._pending_binary = msg["id"]
                self._pending_binary_length = msg["binary_length"]

                if msg.get("data") and msg["data"].get("port_id", None) is not None:
                    self._pending_port_id = msg["data"].get("port_id")
            else:
                self._handle({"data": msg})
        else:
            # websocket client sometimes calls None on disconnect ..
            pass

    async def send(self, msg):
        """Send a message to the Websocket endpoint."""
        if (
            isinstance(msg, dict)
            and msg.get("args")
            and len(msg["args"]) > 0
            and isinstance(msg["args"][0], (bytes, bytearray))
        ):
            msg["binary_length"] = len(msg["args"][0])
            pre_msg = msg
            binary_msg = pre_msg["args"].pop(0)

            # tornado_handler expects the first arg to be an empty object,
            # which is the result of stringifying an ArrayBuffer in JS - add
            # an empty dict here so we don't break compatibility.
            pre_msg["args"].insert(0, {})

            # Must be received in order - expectation that binary follows premsg
            await asyncio.gather(
                *[
                    self._websocket.write(json.dumps(pre_msg, cls=DateTimeEncoder)),
                    self._websocket.write(binary_msg, binary=True),
                ]
            )

        elif isinstance(msg, str):
            await self._websocket.write(msg)

        else:
            await self._websocket.write(json.dumps(msg, cls=DateTimeEncoder))

    async def terminate(self):
        """Close the websocket client connection."""
        await self._ping_callback.stop()
        await self._websocket.close()
