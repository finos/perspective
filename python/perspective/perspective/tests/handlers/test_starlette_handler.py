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

import pytest
import random

from contextlib import asynccontextmanager
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


async def websocket_handler(websocket: WebSocket):
    handler = PerspectiveStarletteHandler(manager=MANAGER, websocket=websocket)
    await handler.run()


APPLICATION = FastAPI()
APPLICATION.add_api_websocket_route("/websocket", websocket_handler)

CLIENT = TestClient(APPLICATION)


class TestPerspectiveStarletteHandler(object):
    def setup_method(self):
        """Flush manager state before each test method execution."""
        MANAGER._tables = {}
        MANAGER._views = {}

    @asynccontextmanager
    async def managed_websocket_client(self):
        """Connect and manage a websocket client connection to the
        Perspective starlette server.
        """
        client = await websocket(CLIENT, "/websocket")
        try:
            yield client
        finally:
            await client.terminate()

    @pytest.mark.asyncio
    async def test_starlette_handler_init_terminate(self):
        """Using FastAPI's builtin test client, test the websocket provided by
        PerspectiveStarletteHandler.

        All test methods must import `app`, `http_client`, and `http_port`,
        otherwise a mysterious timeout will occur."""
        async with self.managed_websocket_client() as client:
            # terminate() is called by the context manager
            assert client is not None

    @pytest.mark.asyncio
    async def test_starlette_handler_table_method(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)

            schema = await table.schema()
            size = await table.size()

            assert schema == {
                "a": "integer",
                "b": "float",
                "c": "string",
                "d": "datetime",
            }

            assert size == 10

    @pytest.mark.asyncio
    async def test_starlette_handler_make_table(self):
        async with self.managed_websocket_client() as client:
            table = await client.table(data)
            size = await table.size()

            assert size == 10

            table.update(data)

            size2 = await table.size()
            assert size2 == 20

    @pytest.mark.asyncio
    async def test_starlette_handler_table_update(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            size = await table.size()

            assert size == 10

            table.update(data)

            size2 = await table.size()
            assert size2 == 20

    @pytest.mark.asyncio
    async def test_starlette_handler_table_update_port(self, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            view = await table.view()

            size = await table.size()

            assert size == 10

            for i in range(5):
                await table.make_port()

            port = await table.make_port()

            s = sentinel(False)

            def updater(port_id):
                s.set(True)
                assert port_id == port

            view.on_update(updater)

            table.update(data, port_id=port)

            size2 = await table.size()
            assert size2 == 20
            assert s.get() is True

    @pytest.mark.asyncio
    async def test_starlette_handler_table_update_row_delta(self, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            view = await table.view()

            size = await table.size()

            assert size == 10

            s = sentinel(False)

            def updater(port_id, delta):
                s.set(True)
                assert port_id == 0
                t2 = Table(delta)
                assert t2.view().to_dict() == data

            view.on_update(updater, mode="row")

            table.update(data)

            size2 = await table.size()
            assert size2 == 20
            assert s.get() is True

    @pytest.mark.asyncio
    async def test_starlette_handler_table_update_row_delta_port(self, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            view = await table.view()

            size = await table.size()

            assert size == 10

            for i in range(5):
                await table.make_port()

            port = await table.make_port()

            s = sentinel(False)

            def updater(port_id, delta):
                s.set(True)
                assert port_id == port

                t2 = Table(delta)
                assert t2.view().to_dict() == data

            view.on_update(updater, mode="row")

            table.update(data, port_id=port)

            size2 = await table.size()
            assert size2 == 20
            assert s.get() is True

    @pytest.mark.asyncio
    async def test_starlette_handler_table_remove(self):
        table_name = str(random.random())
        _table = Table(data, index="a")
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            size = await table.size()

            assert size == 10

            table.remove([i for i in range(5)])

            view = await table.view(columns=["a"])
            output = await view.to_dict()

            assert output == {"a": [i for i in range(5, 10)]}

    @pytest.mark.asyncio
    async def test_starlette_handler_create_view(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            view = await table.view(columns=["a"])
            output = await view.to_dict()

            assert output == {
                "a": [i for i in range(10)],
            }

    @pytest.mark.asyncio
    async def test_starlette_handler_create_view_errors(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)

            with pytest.raises(PerspectiveError) as exc:
                await table.view(columns=["abcde"])

            assert str(exc.value) == "Invalid column 'abcde' found in View columns.\n"

    @pytest.mark.asyncio
    async def test_starlette_handler_create_view_to_arrow(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            view = await table.view()
            output = await view.to_arrow()
            expected = await table.schema()

            assert Table(output).schema(as_string=True) == expected

    @pytest.mark.asyncio
    async def test_starlette_handler_create_view_to_arrow_update(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            table = client.open_table(table_name)
            view = await table.view()

            output = await view.to_arrow()

            for _ in range(10):
                await table.update(output)

            size2 = await table.size()
            assert size2 == 110

    @pytest.mark.asyncio
    async def test_starlette_handler_get_hosted_table_names(self):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        async with self.managed_websocket_client() as client:
            names = await client.get_hosted_table_names()
            assert names == [table_name]
