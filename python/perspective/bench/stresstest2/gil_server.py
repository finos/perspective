################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import multiprocessing
import asyncio
import os
import os.path
import perspective
import tornado
import threading

TABLE_SCALAR = 20
DOWNLOAD_ITERATIONS = 1
NUM_CLIENTS = 10

file_path = os.path.join(
    os.path.abspath(os.path.dirname(__file__)),
    "..",
    "..",
    "..",
    "..",
    "node_modules",
    "superstore-arrow",
    "superstore.arrow",
)


def perspective_thread(manager):
    """Start a new perspective loop in this thread."""
    loop = asyncio.new_event_loop()
    manager.set_loop_callback(loop.call_soon_threadsafe)
    loop.run_forever()


def get_table():
    """Get a test table, made from "superstore.arrow" repeated `TABLE_SCALAR`
    times."""
    with open(file_path, mode="rb") as file:
        arrow = file.read()
    table = perspective.Table(arrow)
    for _ in range(TABLE_SCALAR - 1):
        table.update(arrow)
    return table


def make_app(manager):
    """Make a tornado server for the thread local event loop."""
    app = tornado.web.Application(
        [
            (
                r"/",
                perspective.tornado_handler.PerspectiveTornadoHandler,
                {"manager": manager},
            )
        ]
    )

    app.listen(8080)


def server(queue, is_async):
    """Start a server, within this process."""
    manager = perspective.PerspectiveManager()
    table = get_table()
    manager.host_table("data_source_one", table)
    manager.host_view("view_one", table.view())

    if is_async:
        thread = threading.Thread(target=perspective_thread, args=(manager,))
        # thread.daemon = True
        thread.start()

    loop = tornado.ioloop.IOLoop.current()
    loop.add_callback(queue.put, True)
    if not is_async:
        manager.set_loop_callback(loop.add_callback)

    make_app(manager)
    loop.start()


def start_server(queue, is_async):
    """Start a server process."""
    server_process = multiprocessing.Process(target=server, args=(queue, is_async))
    # server_process.daemon = True
    server_process.start()


def run(is_async):
    """Runs an entire test scenario, server and client pool, then prints run
    statistics.  The server under test can be run in `sync` or `async` modes."""
    queue = multiprocessing.Queue()
    start_server(queue, is_async)


if __name__ == "__main__":
    print("Running server")
    proc = multiprocessing.Process(target=run, args=(True,))
    proc.start()