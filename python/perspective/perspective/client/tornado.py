################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from tornado import ioloop
from tornado.websocket import websocket_connect

from .websocket import (
    PerspectiveWebsocketClient,
    PerspectiveWebsocketConnection,
    Periodic,
)


class TornadoPeriodic(Periodic):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ping_callback = ioloop.PeriodicCallback(
            self._callback,
            callback_time=self._interval,
        )

    async def start(self):
        self._ping_callback.start()

    async def stop(self):
        self._ping_callback.stop()


class PerspectiveTornadoWebsocketConnection(PerspectiveWebsocketConnection):
    def __init__(self):
        self._ws = None

    async def connect(self, url, on_message, max_message_size) -> None:
        self._ws = await websocket_connect(
            url,
            on_message_callback=on_message,
            max_message_size=max_message_size,
        )

    def periodic(self, callback, interval) -> Periodic:
        return TornadoPeriodic(callback=callback, interval=interval)

    async def write(self, message, binary=False):
        return await self._ws.write_message(message, binary=binary)

    async def close(self):
        self._ws.close()


class PerspectiveTornadoClient(PerspectiveWebsocketClient):
    def __init__(self):
        """Create a `PerspectiveTornadoClient` that interfaces with a Perspective server over a Websocket"""
        super(PerspectiveTornadoClient, self).__init__(
            PerspectiveTornadoWebsocketConnection()
        )


async def websocket(url):
    """Create a new websocket client at the given `url` using the thread current
    tornado loop."""
    client = PerspectiveTornadoClient()
    await client.connect(url)
    return client
