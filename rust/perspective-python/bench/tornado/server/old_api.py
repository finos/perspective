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

from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler


here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(here, "..", "..", "..", "..", "..", "node_modules", "superstore-arrow", "superstore.lz4.arrow")

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


old_on_message = PerspectiveTornadoHandler.on_message


def new_on_message(*args, **kwargs):
    print("PerspectiveTornadoHandler.on_message", args, kwargs)
    return old_on_message(*args, **kwargs)


old_write_message = PerspectiveTornadoHandler.write_message


def new_write_message(*args, **kwargs):
    print("PerspectiveTornadoHandler.write_message", args, kwargs)
    return old_write_message(*args, **kwargs)


# PerspectiveTornadoHandler.on_message = new_on_message
# PerspectiveTornadoHandler.write_message = new_write_message


def make_app():
    with open(file_path, mode="rb") as file:
        data = file.read()
        table = Table(data)
        for _ in range(10):
            table.update(data)

    manager = PerspectiveManager()
    thread = threading.Thread(target=perspective_thread, args=(manager, table))
    thread.daemon = True
    thread.start()

    return tornado.web.Application(
        [
            (
                r"/ws",
                PerspectiveTornadoHandler,
                {"manager": manager, "check_origin": True},
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


def main():
    app = make_app()
    app.listen(8080)
    logging.critical("Listening on http://localhost:8080")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()


if __name__ == "__main__":
    server = threading.Thread(target=main)
    server.daemon = True
    server.start()
    server.join()
