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

from asyncio import ensure_future
from starlette.websockets import WebSocketDisconnect
from perspective.core.globalpsp import Session

__all__ = ("PerspectiveStarletteHandler",)


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

    def __init__(self, perspective, websocket):
        self._websocket = websocket
        self._session = perspective.session(self._websocket.send_bytes)

    async def run(self) -> None:
        try:
            await self._websocket.accept()
            while True:
                message = await self._websocket.receive()
                self._websocket._raise_on_disconnect(message)
                if "bytes" in message:
                    self._session.handle_request(message["bytes"])
        finally:
            del self._session
