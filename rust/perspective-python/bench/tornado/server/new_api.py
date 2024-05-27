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

import multiprocessing
import asyncio
import os
import os.path
import perspective
import time
from perspective.core.globalpsp import shared_client
from perspective.handlers.new_tornado import PerspectiveTornadoHandler
from tornado.websocket import websocket_connect
import tornado
import threading
import numpy

TABLE_SCALAR = 20
DOWNLOAD_ITERATIONS = 1
NUM_CLIENTS = 10

file_path = os.path.join(
    os.path.abspath(os.path.dirname(__file__)),
    "..",
    "..",
    "..",
    "..",
    "..",
    "node_modules",
    "superstore-arrow",
    "superstore.lz4.arrow",
)


async def session():
    """Perform client test."""
    times = numpy.zeros(DOWNLOAD_ITERATIONS)
    client = await shared_client()
    table = client.open_table("data_source_one")
    view = await table.view()
    for i in range(DOWNLOAD_ITERATIONS):
        start = time.time()
        arrow = await view.to_arrow()
        times[i] = time.time() - start
        assert len(arrow) > 0
    return times


# Server

def make_app(queue: multiprocessing.Queue, port: int = 8080):
    """Make a tornado server for the thread local event loop."""
    app = tornado.web.Application(
        [
            (
                r"/ws",
                PerspectiveTornadoHandler,
                {},
            ),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {"path": os.path.join(os.path.dirname(__file__), "../client/dist"), "default_filename": "index.html"},
            )
        ]
    )

    app.listen(port)
    queue.put("ready")


def server(queue: multiprocessing.Queue):
    loop = tornado.ioloop.IOLoop.current()
    make_app(queue)
    loop.start()


def start_server(queue: multiprocessing.Queue):
    """Start a server process."""
    server_process = threading.Thread(target=server, args=(queue,))
    server_process.daemon = True
    server_process.start()
    return server_process

def main():
    """Runs an entire test scenario, server and client pool, then prints run
    statistics.  The server under test can be run in `sync` or `async` modes.

    This example uses PerspectiveTornadoBenchmark, which wraps a task function
    and runs it over multiple clients and multiple runs."""
    queue = multiprocessing.Queue()
    server_process = start_server(queue)

    print("Waiting for server to boot...")
    queue.get()
    print("Booted!")
    server_process.join()


if __name__ == "__main__":
    main()