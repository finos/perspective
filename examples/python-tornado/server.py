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

import os
import os.path
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
import threading
import concurrent.futures

from perspective.core.globalpsp import shared_client, _psp_server
from perspective.handlers.new_tornado import PerspectiveTornadoHandler
import asyncio


here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(
    here, "..", "..", "node_modules", "superstore-arrow", "superstore.lz4.arrow"
)

IS_MULTI_THREADED = True


def perspective_thread(manager, table):
    """Perspective application thread starts its own tornado IOLoop, and
    adds the table with the name "data_source_one", which will be used
    in the front-end."""
    psp_loop = tornado.ioloop.IOLoop()
    manager.host_table("data_source_one", table)
    if IS_MULTI_THREADED:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            manager.set_loop_callback(psp_loop.run_in_executor, executor)
            psp_loop.start()
    else:
        manager.set_loop_callback(psp_loop.add_callback)
        psp_loop.start()


async def init_table():
    client = await shared_client()
    # with open(file_path, mode="rb") as file:
    #     data = file.read()
    table = await client.table({"x": "integer"}, name="data_source_one")
    size = 10
    for i in range(size):
        rows = [*range(i * size, (i + 1) * size)]
        await table.update({'x': rows})
        # await table.size()
        _psp_server.poll()
        await asyncio.sleep(5)

def update_thread():
    asyncio.run(init_table())

def make_app():
    return tornado.web.Application(
        [
            (
                r"/websocket",
                PerspectiveTornadoHandler,
                {},
            ),
            (
                r"/node_modules/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "../../node_modules/"},
            ),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "./", "default_filename": "index.html"},
            ),
        ]
    )


if __name__ == "__main__":
    app = make_app()
    app.listen(8082)
    logging.critical("Listening on http://localhost:8080")
    loop = tornado.ioloop.IOLoop.current()
    t = threading.Thread(target=update_thread)
    t.daemon = True
    t.start()
    loop.start()
