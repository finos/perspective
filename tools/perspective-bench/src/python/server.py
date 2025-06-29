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

# This module handles historic versions of `perspective-python`'s API.


import os
import os.path

# import concurrent.futures
import threading
import tornado
import perspective
import perspective.handlers.tornado

here = os.path.abspath(os.path.dirname(__file__))
file_path = os.path.join(
    here, "..", "..", "node_modules", "superstore-arrow", "superstore.lz4.arrow"
)

if not perspective.__version__.startswith("3"):
    from perspective import PerspectiveManager, PerspectiveTornadoHandler

    def perspective_thread(
        manager,
    ):
        psp_loop = tornado.ioloop.IOLoop()
        # [x, y, z] = map(int, perspective.__version__.split("."))
        # if x > 2 or (x > 1 and y > 2):
        #     # with concurrent.futures.ThreadPoolExecutor() as executor:
        #         # manager.set_loop_callback(psp_loop.run_in_executor, executor)
        #         psp_loop.start()
        # else:
        #     manager.set_loop_callback(psp_loop.add_callback)
        psp_loop.start()

    def make_app():
        manager = PerspectiveManager()
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
                    {"path": "../../node_modules/"},
                ),
            ],
            websocket_max_message_size=1000 * 1024 * 1024,
        )

    if __name__ == "__main__":
        app = make_app()
        app.listen(8082)
        loop = tornado.ioloop.IOLoop.current()
        print("Listening on 8082", flush=True)
        loop.start()

else:

    def make_app(perspective_server):
        return tornado.web.Application(
            [
                (
                    r"/websocket",
                    perspective.handlers.tornado.PerspectiveTornadoHandler,
                    {"perspective_server": perspective_server},
                ),
                (
                    r"/node_modules/(.*)",
                    tornado.web.StaticFileHandler,
                    {"path": "../../node_modules/"},
                ),
            ],
            websocket_max_message_size=1000 * 1024 * 1024,
        )

    if __name__ == "__main__":
        perspective_server = perspective.Server()
        app = make_app(perspective_server)
        app.listen(8082)
        loop = tornado.ioloop.IOLoop.current()
        client = perspective_server.new_local_client()
        print("Listening on 8082", flush=True)
        loop.start()
