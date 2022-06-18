################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

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
    PerspectiveError,
)


data = {
    "a": [i for i in range(10)],
    "b": [i * 1.5 for i in range(10)],
    "c": [str(i) for i in range(10)],
    "d": [datetime(2020, 3, i, i, 30, 45) for i in range(1, 11)],
}

MANAGER = PerspectiveManager()


async def websocket_handler(request):
    handler = PerspectiveAIOHTTPHandler(manager=MANAGER, request=request)
    await handler.run()


@pytest.fixture
def app():
    app = web.Application()
    app.router.add_get("/websocket", websocket_handler)
    return app


class TestPerspectiveAIOHTTPHandler(object):
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
    async def test_aiohttp_handler_init_terminate(self, app, aiohttp_client):
        """Using AIOHTTP's websocket client, test the websocket provided by
        PerspectiveAIOHTTPHandler"""
        client = await self.websocket_client(app, aiohttp_client)
        await client.terminate()

    @pytest.mark.asyncio
    async def test_aiohttp_handler_table_method(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
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
    async def test_aiohttp_handler_make_table(self, app, aiohttp_client):
        client = await self.websocket_client(app, aiohttp_client)
        table = await client.table(data)
        size = await table.size()

        assert size == 10

        table.update(data)

        size2 = await table.size()
        assert size2 == 20

    @pytest.mark.asyncio
    async def test_aiohttp_handler_table_update(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        size = await table.size()

        assert size == 10

        table.update(data)

        size2 = await table.size()
        assert size2 == 20

    @pytest.mark.asyncio
    async def test_aiohttp_handler_table_update_port(
        self, app, aiohttp_client, sentinel
    ):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
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
    async def test_aiohttp_handler_table_update_row_delta(
        self, app, aiohttp_client, sentinel
    ):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        view = await table.view()

        size = await table.size()

        assert size == 10

        s = sentinel(False)

        def updater(port_id, delta):
            s.set(True)
            t2 = Table(delta)
            assert t2.view().to_dict() == data
            assert port_id == 0

        view.on_update(updater, mode="row")

        table.update(data)

        size2 = await table.size()
        assert size2 == 20
        assert s.get() is True

    @pytest.mark.asyncio
    async def test_aiohttp_handler_table_update_row_delta_port(
        self, app, aiohttp_client, sentinel
    ):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
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
            t2 = Table(delta)
            assert t2.view().to_dict() == data
            assert port_id == port

        view.on_update(updater, mode="row")

        table.update(data, port_id=port)

        size2 = await table.size()
        assert size2 == 20
        assert s.get() is True

    @pytest.mark.asyncio
    async def test_aiohttp_handler_table_remove(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data, index="a")
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        size = await table.size()

        assert size == 10

        table.remove([i for i in range(5)])

        view = await table.view(columns=["a"])
        output = await view.to_dict()

        assert output == {"a": [i for i in range(5, 10)]}

    @pytest.mark.asyncio
    async def test_aiohttp_handler_create_view(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)
        view = await table.view(columns=["a"])
        output = await view.to_dict()

        assert output == {
            "a": [i for i in range(10)],
        }

    @pytest.mark.asyncio
    async def test_aiohttp_handler_create_view_errors(self, app, aiohttp_client):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(app, aiohttp_client)
        table = client.open_table(table_name)

        with pytest.raises(PerspectiveError) as exc:
            await table.view(columns=["abcde"])

        assert str(exc.value) == "Invalid column 'abcde' found in View columns.\n"

    @pytest.mark.asyncio
    async def test_aiohttp_handler_create_view_to_arrow(self, app, aiohttp_client):
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
    async def test_aiohttp_handler_create_view_to_arrow_update(
        self, app, aiohttp_client
    ):
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
