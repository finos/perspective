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
import pprint
import time
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
    "node_modules",
    "superstore-arrow",
    "superstore.arrow",
)


# Client


def least_sq(y):
    y = numpy.sort(y)
    n = len(y)
    x = numpy.arange(1, n + 1)
    x_mean = numpy.mean(x)
    y_mean = numpy.mean(y)
    numerator = 0
    denominator = 0
    for i in range(n):
        numerator += (x[i] - x_mean) * (y[i] - y_mean)
        denominator += (x[i] - x_mean) ** 2

    m = numerator / denominator
    b = y_mean - (m * x_mean)

    pprint.pprint(list(map(lambda x: round(x, 2), y)))
    print("Bias Coef {:.2f}".format(m))
    print("Intercept {:.2f}".format(b))
    print("Range {:.2f}".format(y[n - 1] - y[0]))
    print("Mean {:.2f}".format(numpy.mean(y)))


async def session():
    """Perform client test."""
    times = numpy.zeros(DOWNLOAD_ITERATIONS)
    client = await perspective.tornado_handler.websocket("ws://127.0.0.1:8080/")
    table = client.open_table("data_source_one")
    view = table.view()
    for i in range(DOWNLOAD_ITERATIONS):
        start = time.time()
        arrow = await view.to_arrow()
        times[i] = time.time() - start
        assert len(arrow) > 0
    client.terminate()
    return times


def client(i):
    """Start a client in this thread."""
    return asyncio.run(session())


def start_client(queue):
    """Start a pool of clients, when `queue.get()` unblocks."""
    queue.get()
    with multiprocessing.Pool(processes=NUM_CLIENTS) as pool:
        samples = pool.map(client, range(NUM_CLIENTS))
        least_sq(numpy.array(samples).flatten())


# Server


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
        thread.daemon = True
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
    server_process.daemon = True
    server_process.start()


# Main


def run(is_async):
    """Runs an entire test scenario, server and client pool, then prints run
    statistics.  The server under test can be run in `sync` or `async` modes."""
    queue = multiprocessing.Queue()
    start_server(queue, is_async)
    start_client(queue)


if __name__ == "__main__":
    print("Sync mode")
    proc = multiprocessing.Process(target=run, args=(False,))
    proc.start()
    proc.join()

    print("\nAsync mode")
    proc = multiprocessing.Process(target=run, args=(True,))
    proc.start()
    proc.join()
