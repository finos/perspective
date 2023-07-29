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
from tornado import gen
from datetime import datetime

from perspective import (
    Table,
    PerspectiveManager,
    PerspectiveTornadoHandler,
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
            {"manager": MANAGER, "check_origin": True, "chunk_size": 500},
        )
    ]
)


@pytest.fixture(scope="module")
def app():
    return APPLICATION


class TestPerspectiveTornadoHandlerChunked(object):
    def setup_method(self):
        """Flush manager state before each test method execution."""
        MANAGER._tables = {}
        MANAGER._views = {}

    async def websocket_client(self, port):
        """Connect and initialize a websocket client connection to the
        Perspective tornado server.
        """
        client = await websocket("ws://127.0.0.1:{}/websocket".format(port))
        return client

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_create_view_to_arrow_chunked(self, app, http_client, http_port, sentinel):
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
    async def test_tornado_handler_create_view_to_arrow_update_chunked(self, app, http_client, http_port, sentinel):
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

    @pytest.mark.gen_test(run_sync=False)
    async def test_tornado_handler_update_chunked_interleaved_with_trivial(self, app, http_client, http_port, sentinel):
        """Tests that, when a chunked response `output_fut` is interleaved with
        a response belonging to another message ID (and not binary encoded)
        `size3`, both messages de-multiplex correclty and succeed.
        """
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
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
