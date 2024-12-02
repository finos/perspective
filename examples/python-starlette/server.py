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
import uvicorn

from fastapi import FastAPI, WebSocket
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles

from perspective import Server
from perspective.handlers.starlette import PerspectiveStarletteHandler


here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(
    here, "..", "..", "node_modules", "superstore-arrow", "superstore.lz4.arrow"
)


def static_node_modules_handler(rest_of_path):
    return FileResponse("../../node_modules/{}".format(rest_of_path))


def perspective_thread(server):
    """Perspective application thread starts its own event loop, and
    adds the table with the name "data_source_one", which will be used
    in the front-end."""
    psp_loop = asyncio.new_event_loop()
    client = server.new_local_client(loop_callback=psp_loop.call_soon_threadsafe)

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

    async def websocket_handler(websocket: WebSocket):
        handler = PerspectiveStarletteHandler(
            perspective_server=server, websocket=websocket
        )
        await handler.run()

    static_html_files = StaticFiles(directory="../python-tornado", html=True)

    app = FastAPI()
    app.add_api_websocket_route("/websocket", websocket_handler)
    app.get("/node_modules/{rest_of_path:path}")(static_node_modules_handler)
    app.mount("/", static_html_files)
    return app


if __name__ == "__main__":
    app = make_app()
    logging.critical("Listening on http://localhost:8080")
    uvicorn.run(app, host="0.0.0.0", port=8080)
