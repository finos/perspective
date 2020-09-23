################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
import os.path
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
import threading

from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler


here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(
    here,
    "..",
    "..",
    "..",
    "node_modules",
    "superstore-arrow",
    "superstore.arrow",
)


def perspective_thread(manager):
    """Perspective application thread starts its own tornado IOLoop, and
    adds the table with the name "data_source_one", which will be used
    in the front-end."""
    psp_loop = tornado.ioloop.IOLoop()

    # Set Perspective to run in async mode
    manager.set_loop_callback(psp_loop.add_callback)

    with open(file_path, mode="rb") as file:
        table = Table(file.read(), index="Row ID")
        manager.host_table("data_source_one", table)
        manager.host_view("view_one", table.view())

    psp_loop.start()


def make_app():
    manager = PerspectiveManager()

    # Run Perspective in its own thread with its own IOLoop
    thread = threading.Thread(target=perspective_thread, args=(manager,))
    thread.daemon = True
    thread.start()

    return tornado.web.Application(
        [
            (
                r"/websocket",
                PerspectiveTornadoHandler,
                {"manager": manager, "check_origin": True},
            ),
            (
                r"/node_modules/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "../../../node_modules/@finos/"},
            ),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {
                    "path": os.path.join(here, "..", "dist"),
                    "default_filename": "index.html",
                },
            ),
        ],
        websocket_ping_interval=15,
    )


if __name__ == "__main__":
    app = make_app()
    app.listen(8080)
    logging.critical("Listening on http://localhost:8080")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
