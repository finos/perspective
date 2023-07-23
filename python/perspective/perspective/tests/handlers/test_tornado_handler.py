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

import random
import pytest

import tornado
from datetime import datetime

from perspective import (
    Table,
    PerspectiveManager,
    PerspectiveTornadoHandler,
    PerspectiveError,
    tornado_websocket as websocket,
)


data = {
    "a": [i for i in range(10)],
    "b": [i * 1.5 for i in range(10)],
    "c": [str(i) for i in range(10)],
    "d": [datetime(2020, 3, i, i, 30, 45) for i in range(1, 11)],
}

MANAGER = PerspectiveManager()

APPLICATION = tornado.web.Application(
    [
        (
            r"/websocket",
            PerspectiveTornadoHandler,
            {"manager": MANAGER, "check_origin": True},
        )
    ]
)


@pytest.fixture(scope="module")
def app():
    return APPLICATION


class TestPerspectiveTornadoHandler(object):
    def setup_method(self):
        """Flush manager state before each test method execution."""
        MANAGER._tables = {}
        MANAGER._views = {}

    async def websocket_client(self, port):
        """Connect and initialize a websocket client connection to the
        Perspective tornado server.
        """
        client = await websocket("ws://127.0.0.1:{0}/websocket".format(port))
        return client

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_init_terminate(self, app, http_client, http_port):
        """Using Tornado's websocket client, test the websocket provided by
        PerspectiveTornadoHandler.

        All test methods must import `app`, `http_client`, and `http_port`,
        otherwise a mysterious timeout will occur."""
        client = await self.websocket_client(http_port)
        await client.terminate()

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_table_method(self, app, http_client, http_port):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
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

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_make_table(self, app, http_client, http_port):
        client = await self.websocket_client(http_port)
        table = await client.table(data)
        size = await table.size()

        assert size == 10

        table.update(data)

        size2 = await table.size()
        assert size2 == 20

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_table_update(self, app, http_client, http_port):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
        table = client.open_table(table_name)
        size = await table.size()

        assert size == 10

        table.update(data)

        size2 = await table.size()
        assert size2 == 20

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_table_update_port(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
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

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_table_update_row_delta(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
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

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_table_update_row_delta_port(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
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

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_table_remove(self, app, http_client, http_port):
        table_name = str(random.random())
        _table = Table(data, index="a")
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
        table = client.open_table(table_name)
        size = await table.size()

        assert size == 10

        table.remove([i for i in range(5)])

        view = await table.view(columns=["a"])
        output = await view.to_dict()

        assert output == {"a": [i for i in range(5, 10)]}

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_create_view(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
        table = client.open_table(table_name)
        view = await table.view(columns=["a"])
        output = await view.to_dict()

        assert output == {
            "a": [i for i in range(10)],
        }

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_create_view_errors(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
        table = client.open_table(table_name)

        with pytest.raises(PerspectiveError) as exc:
            await table.view(columns=["abcde"])

        assert str(exc.value) == "Invalid column 'abcde' found in View columns.\n"

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_create_view_to_arrow(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
        table = client.open_table(table_name)
        view = await table.view()
        output = await view.to_arrow()
        expected = await table.schema()

        assert Table(output).schema(as_string=True) == expected

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_create_view_to_arrow_update(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
        table = client.open_table(table_name)
        view = await table.view()

        output = await view.to_arrow()

        for i in range(10):
            await table.update(output)

        size2 = await table.size()
        assert size2 == 110
