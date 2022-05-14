################################################################################
#
# Copyright (c) 2022, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import asyncio
import os
import os.path
import logging
import threading
import uvicorn

from fastapi import FastAPI
from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles

from perspective import Table, PerspectiveManager, PerspectiveStarletteHandler


here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(
    here, "..", "..", "node_modules", "superstore-arrow", "superstore.arrow"
)


def perspective_thread(manager):
    """Perspective application thread starts its own tornado IOLoop, and
    adds the table with the name "data_source_one", which will be used
    in the front-end."""
    psp_loop = asyncio.get_running_loop()
    manager.set_loop_callback(psp_loop.add_callback)
    with open(file_path, mode="rb") as file:
        table = Table(file.read(), index="Row ID")
        manager.host_table("data_source_one", table)
    psp_loop.start()


def make_app(fastapi=False):
    '''Create an application.

    To demo wit FastAPI, set FASTAPI env var e.g.
    FASTAPI=1 yarn start

    Args:
        fastapi (bool, optional): make a fastapi app. Defaults to False.
    '''
    manager = PerspectiveManager()

    thread = threading.Thread(target=perspective_thread, args=(manager,))
    thread.daemon = True
    thread.start()

    async def websocket_handler(websocket):
        handler = PerspectiveStarletteHandler(manager, websocket)
        await handler.run()

    static_nodemodules_files = StaticFiles(directory="../../node_modules/@finos/")
    static_html_files = StaticFiles(directory="../python-tornado", html=True)

    if not fastapi:
        routes = [
            Route("/websocket", websocket_handler),
            Mount("/node_modules", static_nodemodules_files),
            Mount("/", static_html_files),
        ]

        app = Starlette(debug=True, routes=routes)
    else:
        app = FastAPI()
        app.add_api_websocket_route('/websocket', websocket_handler)
        app.mount("/node_modules", static_nodemodules_files)
        app.mount("/", static_html_files)


if __name__ == "__main__":
    app = make_app(os.environ.get("FASTAPI", ""))
    logging.critical("Listening on http://localhost:8080")
    uvicorn.run(app, host='0.0.0.0', port=8080)
