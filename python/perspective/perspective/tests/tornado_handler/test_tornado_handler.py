################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import json
import random
import pytest

import tornado
from tornado import gen
from tornado.websocket import websocket_connect
from datetime import datetime

from ...table import Table
from ...manager import PerspectiveManager
from ...manager.manager_internal import DateTimeEncoder
from ...tornado_handler import PerspectiveTornadoHandler


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

    @gen.coroutine
    def websocket_client(self, port):
        """Connect and initialize a websocket client connection to the
        Perspective tornado server.

        If the initialization response is incorrect, raise an `AssertionError`.
        """
        client = yield websocket_connect(
            "ws://127.0.0.1:{0}/websocket".format(port)
        )

        yield client.write_message(json.dumps({"id": -1, "cmd": "init"}))

        response = yield client.read_message()

        assert json.loads(response) == {"id": -1, "data": None}

        # Compatibility with Python < 3.3
        raise gen.Return(client)

    @pytest.mark.gen_test(run_sync=False)
    def test_tornado_handler_init(self, app, http_client, http_port):
        """Using Tornado's websocket client, test the websocket provided by
        PerspectiveTornadoHandler.

        All test methods must import `app`, `http_client`, and `http_port`,
        otherwise a mysterious timeout will occur."""
        yield self.websocket_client(http_port)

    @pytest.mark.gen_test(run_sync=False)
    def test_tornado_handler_table_method(self, app, http_client, http_port):
        table_name = str(random.random())
        table = Table(data)
        MANAGER.host_table(table_name, table)

        client = yield self.websocket_client(http_port)

        yield client.write_message(
            json.dumps(
                {
                    "id": 0,
                    "name": table_name,
                    "cmd": "table_method",
                    "method": "schema",
                    "args": [],
                }
            )
        )

        response = yield client.read_message()

        assert json.loads(response) == {
            "id": 0,
            "data": {
                "a": "integer",
                "b": "float",
                "c": "string",
                "d": "datetime",
            },
        }

    @pytest.mark.gen_test(run_sync=False)
    def test_tornado_handler_create_view_to_dict(
        self, app, http_client, http_port
    ):
        table_name = str(random.random())
        table = Table(data)
        MANAGER.host_table(table_name, table)

        client = yield self.websocket_client(http_port)

        yield client.write_message(
            json.dumps(
                {
                    "id": 0,
                    "cmd": "view",
                    "table_name": table_name,
                    "view_name": "view1",
                }
            )
        )

        yield client.write_message(
            json.dumps(
                {
                    "id": 1,
                    "name": "view1",
                    "cmd": "view_method",
                    "method": "to_dict",
                    "args": [],
                }
            )
        )

        response = yield client.read_message()

        assert response == json.dumps(
            {"id": 1, "data": data}, cls=DateTimeEncoder
        )

    @pytest.mark.gen_test(run_sync=False)
    def test_tornado_handler_create_view_to_dict_one_sided(
        self, app, http_client, http_port
    ):
        table_name = str(random.random())
        table = Table(data)
        MANAGER.host_table(table_name, table)

        client = yield self.websocket_client(http_port)

        yield client.write_message(
            json.dumps(
                {
                    "id": 0,
                    "cmd": "view",
                    "table_name": table_name,
                    "view_name": "view1",
                    "config": {
                        "row_pivots": ["c"]
                    }
                }
            )
        )

        yield client.write_message(
            json.dumps(
                {
                    "id": 1,
                    "name": "view1",
                    "cmd": "view_method",
                    "method": "to_dict",
                    "args": [],
                }
            )
        )

        response = yield client.read_message()

        assert response == json.dumps(
            {
                "id": 1,
                "data": {
                    "__ROW_PATH__": [[]] + [[item] for item in data["c"]],
                    "a": [sum(data["a"])] + data["a"],
                    "b": [sum(data["b"])] + data["b"],
                    "c": [10] + [1 for i in range(10)],
                    "d": [10] + [1 for i in range(10)],
                }
            }, cls=DateTimeEncoder
        )

    @pytest.mark.gen_test(run_sync=False)
    def test_tornado_handler_create_view_to_arrow(
        self, app, http_client, http_port
    ):
        table_name = str(random.random())
        table = Table(data)
        MANAGER.host_table(table_name, table)

        client = yield self.websocket_client(http_port)

        yield client.write_message(
            json.dumps(
                {
                    "id": 0,
                    "cmd": "view",
                    "table_name": table_name,
                    "view_name": "view1",
                }
            )
        )

        yield client.write_message(
            json.dumps(
                {
                    "id": 1,
                    "name": "view1",
                    "cmd": "view_method",
                    "method": "to_arrow",
                    "args": [],
                }
            )
        )

        response = yield client.read_message()

        assert json.loads(response) == {
            "id": 1,
            "name": "view1",
            "cmd": "view_method",
            "method": "to_arrow",
            "args": [],
            "is_transferable": True
        }

        binary = yield client.read_message()
        new_table = Table(binary)
        assert new_table.view().to_dict() == data
