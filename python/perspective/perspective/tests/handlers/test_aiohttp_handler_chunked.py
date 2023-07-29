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

# NOTE: This is essentially a clone of the tornado handler tests,
# but using async/await and starlette handler
import random
import pytest

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


async def websocket_handler(request):
    handler = PerspectiveAIOHTTPHandler(manager=MANAGER, request=request, chunk_size=500)
    await handler.run()


@pytest.fixture
def app():
    app = web.Application()
    app.router.add_get("/websocket", websocket_handler)
    return app


class TestPerspectiveAIOHTTPHandlerChunked(object):
    def setup_method(self):
        """Flush manager state before each test method execution."""
        MANAGER._tables = {}
        MANAGER._views = {}

    async def websocket_client(self, app, aiohttp_client):
        """Connect and initialize a websocket client connection to the
        Perspective aiottp server.
        """
        client = await aiohttp_client(app)
        return await websocket("http://{}:{}/websocket".format(client.host, client.port), client.session)

    @pytest.mark.asyncio
    async def test_aiohttp_handler_create_view_to_arrow_chunked(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        view = await table.view()
        output = await view.to_arrow()
        expected = await table.schema()

        assert Table(output).schema(as_string=True) == expected

    @pytest.mark.asyncio
    async def test_aiohttp_handler_create_view_to_arrow_update_chunked(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        view = await table.view()

        output = await view.to_arrow()

        for i in range(10):
            await table.update(output)

        size2 = await table.size()
        assert size2 == 110

    @pytest.mark.asyncio
    async def test_aiohttp_handler_update_chunked_interleaved_with_trivial(self, app, aiohttp_client):
        """Tests that, when a chunked response `output_fut` is interleaved with
        a response belonging to another message ID (and not binary encoded)
        `size3`, both messages de-multiplex correclty and succeed.
        """
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        view = await table.view()

        output_fut = view.to_arrow()
        size3 = await view.num_rows()
        assert size3 == 10

        output = await output_fut

        for i in range(10):
            await table.update(output)

        size2 = await table.size()
        assert size2 == 110
