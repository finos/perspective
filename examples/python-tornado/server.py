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


from perspective import PySyncClient, PySyncServer

# from perspective.core.globalpsp import shared_client
# from perspective.handlers.new_tornado import PerspectiveTornadoHandler


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


async def init_table(client):
    # client = PySyncClient(handle_request)
    with open(file_path, mode="rb") as file:
        data = file.read()
        table = client.table(data, name="data_source_one")
        for _ in range(10):
            table.update(data)


def make_app(server):
    return tornado.web.Application(
        [
            (
                r"/websocket",
                PerspectiveTornadoHandler,
                {"psp_server": server},
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


class PerspectiveTornadoHandler(tornado.websocket.WebSocketHandler):
    def __init__(self, *args, **kwargs):
        psp_server = kwargs.pop("psp_server")
        super().__init__(*args, **kwargs)
        self.server = psp_server

    def open(self):
        def inner(msg):
            self.write_message(msg, binary=True)

        self.session = self.server.new_session(inner)

    def on_close(self) -> None:
        self.session.close()
        del self.session

    def on_message(self, msg: bytes):
        if not isinstance(msg, bytes):
            return

        self.session.handle_request(msg)
        self.session.poll()


def new_client(server):
    def handle_sync_client(bytes):
        sync_session.handle_request(bytes)
        sync_session.poll()

    def handle_new_session(bytes):
        local_sync_client.handle_response(bytes)

    sync_session = server.new_session(handle_new_session)
    local_sync_client = PySyncClient(handle_sync_client)
    return local_sync_client


if __name__ == "__main__":
    psp_server = PySyncServer()
    app = make_app(psp_server)
    app.listen(8082)
    client = new_client(psp_server)
    logging.critical("Listening on http://localhost:8082")
    loop = tornado.ioloop.IOLoop.current()
    loop.call_later(0, init_table, client)
    loop.start()
