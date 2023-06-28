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

import pytest
import random
import threading
import asyncio

from datetime import datetime

from fastapi import FastAPI, WebSocket
from fastapi.testclient import TestClient

from perspective import (
    Table,
    PerspectiveManager,
    PerspectiveStarletteHandler,
    PerspectiveError,
)

from perspective.client.starlette_test import websocket

data = {
    "a": [i for i in range(10)],
    "b": [i * 1.5 for i in range(10)],
    "c": [str(i) for i in range(10)],
    "d": [datetime(2020, 3, i, i, 30, 45) for i in range(1, 11)],
}

MANAGER = PerspectiveManager()


def perspective_thread(manager):
    psp_loop = asyncio.new_event_loop()
    manager.set_loop_callback(psp_loop.call_soon_threadsafe)
    psp_loop.run_forever()


thread = threading.Thread(target=perspective_thread, args=(MANAGER,))
thread.daemon = True
thread.start()


async def websocket_handler(websocket: WebSocket):
    handler = PerspectiveStarletteHandler(manager=MANAGER, websocket=websocket)
    await handler.run()


APPLICATION = FastAPI()
APPLICATION.add_api_websocket_route("/websocket", websocket_handler)

CLIENT = TestClient(APPLICATION)


class TestPerspectiveStarletteHandlerAsyncMode(object):
    def setup_method(self):
        """Flush manager state before each test method execution."""
        MANAGER._tables = {}
        MANAGER._views = {}

    async def websocket_client(self):
        return await websocket(CLIENT, "/websocket")

    @pytest.mark.asyncio
    async def test_starlette_handler_async_manager_thread(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)
        client = await self.websocket_client()
        table = client.open_table(table_name)
        view = await table.view()
        reqs = []
        for x in range(10):
            reqs.append(table.update(data))
            reqs.append(view.to_arrow())

        await asyncio.gather(*reqs)
        records = await view.to_records()
        assert len(records) == 110

        await client.terminate()
