################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import asyncio
from starlette.websockets import WebSocket
from ..core.exception import PerspectiveError


class PerspectiveStarletteHandler(object):
    """PerspectiveStarletteHandler is a drop-in implementation of Perspective.

    The Perspective client and server will automatically keep the Websocket
    alive without timing out.

    Examples:
        >>> MANAGER = PerspectiveManager()
        >>> MANAGER.host_table("data_source_one", Table(
        ...     pd.read_csv("superstore.csv")))
        >>> app = FastAPI()
        >>> async def endpoint(websocket: Websocket):
        ...     handler = PerspectiveStarletteHandler(manager, websocket)
        ...     await handler.run()
        ... app.add_api_websocket_route('/websocket', endpoint)
    """

    def __init__(self, manager, websocket: WebSocket, check_origin=False,
                 chunk_size=25165824, chunk_sleep=0):
        """Create a new instance of the PerspectiveTornadoHandler with the
        given Manager instance.

        Keyword Args:
            manager (:obj:`PerspectiveManager`): A `PerspectiveManager` instance.
                Must be provided on initialization.
            check_origin (:obj`bool`): If True, all requests will be accepted
                regardless of origin. Defaults to False.
            chunk_size (:obj:`int`): Binary messages will not exceed this length
                (in bytes);  payloads above this limit will be chunked
                across multiple messages. Defaults to `25165824` (24MB), and
                be disabled entirely with `None`.
        """
        self._manager = manager
        self._check_origin = check_origin
        self._chunk_size = chunk_size
        self._session = self._manager.new_session()
        self._websocket = websocket
        self._chunk_sleep = chunk_sleep

        if self._manager is None:
            raise PerspectiveError(
                "A `PerspectiveManager` instance must be provided to the handler!"
            )

    def check_origin(self, origin):
        """TODO
        """
        return self._check_origin

    async def run(self) -> None:
        try:
            while True:
                message = await self.websocket.receive_text()
                await self.on_message(message)
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
            return asyncio.run_coroutine_threadsafe(self.post(*args, **kwargs), asyncio.get_event_loop())
        self._session.process(message, runner)

    async def post(self, message, binary=False):
        """When `post` is called by `PerspectiveManager`, serialize the data to
        JSON and send it to the client.

        TODO: not clear if WS needs to be locked in starlette like tornado, hopefully not?

        Args:
            message (:obj:`str`): a JSON-serialized string containing a message to the
                front-end `perspective-viewer`.
        """
        # Only send message in chunks if it passes the threshold set by the
        # `PerspectiveManager`.
        chunked = len(message) > self._chunk_size

        if binary and chunked:
            await self._post_chunked(
                message,
                0,
                self._chunk_size,
                len(message),
            )
        else:
            await self.write_message(message, binary)

    def on_close(self):
        """Remove the views associated with the client when the websocket
        closes.
        """
        self._session.close()

    async def _post_chunked(self, message, start, end, message_length):
        """Send a binary message in chunks on the websocket."""
        if start < message_length:
            end = start + self._chunk_size

            if end >= message_length:
                end = message_length

            await self.write_message(message[start:end], binary=True)
            start = end

            # Allow the loop to process heartbeats so that client sockets don't
            # get closed in the middle of sending a chunk.
            await asyncio.sleep(self._chunk_sleep)
            await self._post_chunked(message, start, end, message_length)

    async def write_message(self, message: str, binary: bool = False) -> None:
        if binary:
            await self.websocket.send_bytes(message)
        else:
            await self.websocket.send_text(message)
