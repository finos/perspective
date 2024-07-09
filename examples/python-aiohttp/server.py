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

import asyncio
import os
import os.path
import logging
import threading

from aiohttp import web

from perspective import Server
from perspective.handlers import PerspectiveAIOHTTPHandler


here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(
    here, "..", "..", "node_modules", "superstore-arrow", "superstore.lz4.arrow"
)


def perspective_thread(server):
    """Perspective application thread starts its own event loop, and
    adds the table with the name "data_source_one", which will be used
    in the front-end."""
    psp_loop = asyncio.new_event_loop()
    client = server.new_client(loop_callback=psp_loop.call_soon_threadsafe)

    def init():
        with open(file_path, mode="rb") as file:
            client.table(file.read(), index="Row ID", name="data_source_one")

    psp_loop.call_soon_threadsafe(init)
    psp_loop.run_forever()


def make_app():
    server = Server()
    thread = threading.Thread(target=perspective_thread, args=(server,))
    thread.daemon = True
    thread.start()

    async def websocket_handler(request):
        handler = PerspectiveAIOHTTPHandler(perspective_server=server, request=request)
        await handler.run()

    app = web.Application()
    app.router.add_get("/websocket", websocket_handler)
    app.router.add_static("/node_modules", "../../node_modules/", follow_symlinks=True)
    app.router.add_static("/", "../python-tornado", show_index=True)
    return app


if __name__ == "__main__":
    app = make_app()
    logging.critical("Listening on http://localhost:8080")
    web.run_app(app, host="0.0.0.0", port=8080)
