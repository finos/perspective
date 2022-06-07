################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

# NOTE: see test_tornado_lock for important notes
import asyncio
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


async def websocket_handler(request):
    handler = PerspectiveAIOHTTPHandler(manager=MANAGER, request=request, chunk_size=10)
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
        return await websocket(
            "http://{}:{}/websocket".format(client.host, client.port), client.session
        )

    @pytest.mark.asyncio
    async def test_aiohttp_handler_lock_inflight(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        views = await asyncio.gather(*[table.view() for _ in range(5)])
        outputs = await asyncio.gather(*[view.to_arrow() for view in views])
        expected = await table.schema()

        for output in outputs:
            assert Table(output).schema(as_string=True) == expected
