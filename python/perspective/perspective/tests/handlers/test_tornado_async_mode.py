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

# This test demonstrates the necessity of locks for server
# responses to multiple clients

# This test should be implemented for every new server handler, but
# should otherwise never fail for existing locking implementations.

# To demonstrate failing behavior, modify the tornado handler like so:
# -        yield self._stream_lock.acquire()
# +        # yield self._stream_lock.acquire()
#          try:
#              yield f(*args, **kwargs)
#          except tornado.websocket.WebSocketClosedError:
#              pass
#          finally:
# -            yield self._stream_lock.release()
# +            ...
# +            # yield self._stream_lock.release()


import asyncio
import pytest
import random
import threading
import tornado
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


def perspective_thread(manager):
    psp_loop = asyncio.new_event_loop()
    manager.set_loop_callback(psp_loop.call_soon_threadsafe)
    # with open(file_path, mode="rb") as file:
    #     table = Table(file.read(), index="Row ID")
    #     manager.host_table("data_source_one", table)
    psp_loop.run_forever()


thread = threading.Thread(target=perspective_thread, args=(MANAGER,))
thread.daemon = True
thread.start()


APPLICATION = tornado.web.Application(
    [
        (
            r"/websocket",
            PerspectiveTornadoHandler,
            {"manager": MANAGER, "check_origin": True, "chunk_size": 10},
        )
    ]
)


@pytest.fixture
def app():
    return APPLICATION


class TestPerspectiveTornadoHandlerAsyncMode(object):
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
    async def test_tornado_handler_async_manager_thread(self, app, http_client, http_port, sentinel):
        table_name = str(random.random())
        _table = Table(data)
        MANAGER.host_table(table_name, _table)

        client = await self.websocket_client(http_port)
        table = client.open_table(table_name)
        view = await table.view()
        reqs = []
        for x in range(10):
            reqs.append(table.update(data))
            reqs.append(view.to_arrow())

        await asyncio.gather(*reqs)
        # views = await asyncio.gather(*[table.view() for _ in range(5)])
        # outputs = await asyncio.gather(*[view.to_arrow() for view in views])
        expected = await table.schema()
        records = await view.to_records()

        assert len(records) == 110
