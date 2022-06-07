################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import asyncio
from aiohttp import web, WSMsgType

from .common import PerspectiveHandlerBase


class PerspectiveAIOHTTPHandler(PerspectiveHandlerBase):
    """PerspectiveAIOHTTPHandler is a drop-in implementation of Perspective.

    Use it inside AIOHTTP routing to create a server-side Perspective that is
    ready to receive websocket messages from the front-end `perspective-viewer`.

    The Perspective client and server will automatically keep the Websocket
    alive without timing out.

    Examples:
    """

    def __init__(self, *args, **kwargs):
        """Create a new instance of the PerspectiveAIOHTTPHandler with the
        given Manager instance.
        """
        super().__init__(*args, **kwargs)
        self._request = kwargs.get("request")

    async def run(self) -> None:
        try:
            self._ws = web.WebSocketResponse()
            await self._ws.prepare(self._request)

            async for msg in self._ws:
                if msg.type == WSMsgType.TEXT:
                    await self.on_message(msg.data)
                if msg.type == WSMsgType.BINARY:
                    await self.on_message(msg.data)
        finally:
            self.on_close()

    async def on_message(self, message):
        """When the websocket receives a message, send it to the :obj:`process`
        method of the `PerspectiveManager` with a reference to the :obj:`post`
        callback.
        """
        if message == "ping":
            # Respond to ping heartbeats from the Websocket client.
            await self.write_message("pong")
            return

        def runner(*args, **kwargs):
            return asyncio.run_coroutine_threadsafe(
                self.post(*args, **kwargs), asyncio.get_event_loop()
            )

        self._session.process(message, runner)

    async def post(self, message, binary=False):
        """When `post` is called by `PerspectiveManager`, serialize the data to
        JSON and send it to the client.

        TODO: not clear if WS needs to be locked in aiohttp like tornado, hopefully not?

        Args:
            message (:obj:`str`): a JSON-serialized string containing a message to the
                front-end `perspective-viewer`.
        """
        # Only send message in chunks if it passes the threshold set by the
        # `PerspectiveManager`.
        chunked = len(message) > self._chunk_size

        async with self._stream_lock:
            if binary and chunked:
                start = 0

                while start < len(message):
                    end = start + self._chunk_size
                    if end >= len(message):
                        end = len(message)

                    asyncio.ensure_future(
                        self.write_message(message[start:end], binary=True)
                    )
                    start = end

                    # Allow the loop to process heartbeats so that client sockets don't
                    # get closed in the middle of sending a chunk.
                    await asyncio.sleep(self._chunk_sleep)
            else:
                await self.write_message(message, binary)

    def on_close(self):
        """Remove the views associated with the client when the websocket
        closes.
        """
        self._session.close()

    async def write_message(self, message: str, binary: bool = False) -> None:
        if binary:
            await self._ws.send_bytes(message)
        else:
            await self._ws.send_str(message)
