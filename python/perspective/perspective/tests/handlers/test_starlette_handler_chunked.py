################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

# NOTE: This is essentially a clone of the tornado handler tests,
# but using async/await and starlette handler

import pytest
import random

from datetime import datetime

from fastapi import FastAPI, WebSocket
from fastapi.testclient import TestClient

from perspective import (
    Table,
    PerspectiveManager,
    PerspectiveStarletteHandler,
)

from perspective.client.starlette_test import websocket


data = {
    "a": [i for i in range(10)],
    "b": [i * 1.5 for i in range(10)],
    "c": [str(i) for i in range(10)],
    "d": [datetime(2020, 3, i, i, 30, 45) for i in range(1, 11)],
}

MANAGER = PerspectiveManager()


async def websocket_handler(websocket: WebSocket):
    handler = PerspectiveStarletteHandler(
        manager=MANAGER, websocket=websocket, chunk_size=500
    )
    await handler.run()


APPLICATION = FastAPI()
APPLICATION.add_api_websocket_route("/websocket", websocket_handler)

CLIENT = TestClient(APPLICATION)


class TestPerspectiveStarletteHandlerChunked(object):
    def setup_method(self):
        """Flush manager state before each test method execution."""
        MANAGER._tables = {}
        MANAGER._views = {}

    async def websocket_client(self):
        """Connect and initialize a websocket client connection to the
        Perspective starlette server.
        """
        return await websocket(CLIENT, "/websocket")

    @pytest.mark.asyncio
    async def test_starlette_handler_create_view_to_arrow_chunked(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client()
        table = client.open_table(table_name)
        view = await table.view()
        output = await view.to_arrow()
        expected = await table.schema()

        assert Table(output).schema(as_string=True) == expected
        await client.terminate()

    @pytest.mark.asyncio
    async def test_starlette_handler_create_view_to_arrow_update_chunked(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client()
        table = client.open_table(table_name)
        view = await table.view()

        output = await view.to_arrow()

        for i in range(10):
            await table.update(output)

        size2 = await table.size()
        assert size2 == 110
        await client.terminate()

    @pytest.mark.asyncio
    async def test_starlette_handler_update_chunked_interleaved_with_trivial(self):
        """Tests that, when a chunked response `output_fut` is interleaved with
        a response belonging to another message ID (and not binary encoded)
        `size3`, both messages de-multiplex correclty and succeed.
        """
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client()
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
        await client.terminate()
