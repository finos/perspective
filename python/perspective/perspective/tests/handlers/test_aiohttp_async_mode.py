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
import threading
import pytest
import random

from aiohttp import web
from datetime import datetime

from perspective import (
    Table,
    PerspectiveManager,
    PerspectiveAIOHTTPHandler,
    aiohttp_websocket as websocket,
)


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


async def websocket_handler(request):
    handler = PerspectiveAIOHTTPHandler(manager=MANAGER, request=request)
    await handler.run()


@pytest.fixture
def app():
    app = web.Application()
    app.router.add_get("/websocket", websocket_handler)
    return app


class TestPerspectiveAIOHttpHandlerAsyncMode(object):
    def setup_method(self):
        """Flush manager state before each test method execution."""
        MANAGER._tables = {}
        MANAGER._views = {}

    async def websocket_client(self, app, aiohttp_client):
        client = await aiohttp_client(app)
        return await websocket("http://{}:{}/websocket".format(client.host, client.port), client.session)

    @pytest.mark.asyncio
    async def test_aiohttp_handler_async_manager_thread(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)
        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        view = await table.view()
        reqs = []
        for x in range(10):
            reqs.append(table.update(data))
            reqs.append(view.to_arrow())

        await asyncio.gather(*reqs)
        records = await view.to_records()
        assert len(records) == 110
