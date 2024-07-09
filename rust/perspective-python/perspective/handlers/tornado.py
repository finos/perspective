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

from tornado.websocket import WebSocketHandler


class PerspectiveTornadoHandler(WebSocketHandler):
    """PerspectiveTornadoHandler is a drop-in implementation of Perspective.

    Use it inside Tornado routing to create a server-side Perspective that is
    ready to receive websocket messages from the front-end `perspective-viewer`.
    Because Tornado implements an event loop, this handler links Perspective
    with `IOLoop.current()` in order to defer expensive operations until the
    next free iteration of the event loop.

    The Perspective client and server will automatically keep the Websocket
    alive without timing out.

    Examples:
        >>> server = psp.Server()
        >>> client = server.new_client()
        >>> client.table(pd.read_csv("superstore.csv"), name="data_source_one")
        >>> app = tornado.web.Application([
        ...     (r"/", MainHandler),
        ...     (r"/websocket", PerspectiveTornadoHandler, {
        ...         "perspective_server": server,
        ...         "check_origin": True
        ...     })
        ... ])
    """

    def __init__(self, *args, **kwargs):
        psp_server = kwargs.pop("perspective_server")
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

        # TODO schedule me
        self.session.poll()
