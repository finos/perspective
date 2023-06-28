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

import aiohttp
import asyncio

from .websocket import (
    PerspectiveWebsocketClient,
    PerspectiveWebsocketConnection,
    Periodic,
)


class AIOHTTPPeriodic(Periodic):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._running = True

    async def _run(self):
        while self._running:
            await self._callback()
            await asyncio.sleep(self._interval)

    async def start(self):
        return asyncio.create_task(self._run())

    async def stop(self):
        self._running = False


class PerspectiveAIOHTTPWebsocketConnection(PerspectiveWebsocketConnection):
    def __init__(self, session=None):
        self._ws = None
        self._session = session or aiohttp.ClientSession()
        self._run = True

    async def _receive_messages(self):
        async for msg in self._ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                self._on_message(msg.data)
            elif msg.type == aiohttp.WSMsgType.BINARY:
                self._on_message(msg.data)
            elif msg.type == aiohttp.WSMsgType.CLOSE:
                return

    async def connect(self, url, on_message, **websocket_connect_kwargs) -> None:
        max_message_size = websocket_connect_kwargs.pop("max_message_size", None) or websocket_connect_kwargs.pop("max_msg_size", None) or 1024 * 1024 * 1024
        self._ws_cm = self._session.ws_connect(
            url,
            max_msg_size=max_message_size,
            **websocket_connect_kwargs,
        )
        self._ws = await self._ws_cm.__aenter__()
        self._on_message = on_message
        self._task = asyncio.create_task(self._receive_messages())

    def periodic(self, callback, interval) -> Periodic:
        return AIOHTTPPeriodic(callback=callback, interval=interval)

    async def write(self, message, binary=False):
        if binary:
            return await self._ws.send_bytes(message)
        else:
            return await self._ws.send_str(message)

    async def close(self):
        try:
            self._task.cancel()
            await self._task
        except asyncio.CancelledError:
            ...
        await self._ws.close()


class PerspectiveAIOHTTPClient(PerspectiveWebsocketClient):
    def __init__(self, session=None):
        """Create a `PerspectiveAIOHTTPClient` that interfaces with a Perspective server over a Websocket"""
        super(PerspectiveAIOHTTPClient, self).__init__(PerspectiveAIOHTTPWebsocketConnection(session=session))


async def websocket(url, session=None):
    """Create a new websocket client at the given `url`.

    Args:
        session (:obj:`aiohttp.ClientSession`): An optional aiohtttp session
    """
    client = PerspectiveAIOHTTPClient(session=session)
    await client.connect(url)
    return client
