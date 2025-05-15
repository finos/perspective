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

from tornado.websocket import WebSocketHandler, WebSocketClosedError
from tornado.ioloop import IOLoop
import perspective


class PerspectiveTornadoHandler(WebSocketHandler):
    """`PerspectiveTornadoHandler` is a `perspective.Server` API as a `tornado`
    websocket handler.

    Use it inside `tornado` routing to create a `perspective.Server` that can
    connect to a JavaScript (Wasm) `Client`, providing a virtual interface to
    the `Server`'s resources for e.g. `<perspective-viewer>`.

    Args:
        loop: An optional `IOLoop` instance to use for scheduling IO calls,
            defaults to `IOLoop.current()`.
        executor: An optional executor for scheduling `perspective.Server`
            message processing calls from websocket `Client`s.

    Examples:
        >>> server = psp.Server()
        >>> client = server.new_local_client()
        >>> client.table(pd.read_csv("superstore.csv"), name="data_source_one")
        >>> app = tornado.web.Application([
        ...     (r"/", MainHandler),
        ...     (r"/websocket", PerspectiveTornadoHandler, {
        ...         "perspective_server": server,
        ...     })
        ... ])
    """

    def check_origin(self, origin):
        return True

    def initialize(
        self, perspective_server=perspective.GLOBAL_SERVER, loop=None, executor=None
    ):
        self.server = perspective_server
        self.loop = loop or IOLoop.current()
        self.executor = executor

    def open(self):
        def write(msg):
            try:
                self.write_message(msg, binary=True)
            except WebSocketClosedError:
                self.close()

        def send_response(msg):
            self.loop.add_callback(write, msg)

        self.session = self.server.new_session(send_response)

    def on_close(self) -> None:
        self.session.close()
        del self.session

    def on_message(self, msg: bytes):
        if not isinstance(msg, bytes):
            return

        if self.executor is None:
            self.session.handle_request(msg)
        else:
            self.executor.submit(self.session.handle_request, msg)
