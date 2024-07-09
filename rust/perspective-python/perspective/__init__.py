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

__version__ = "2.10.1"
__all__ = [
    "PerspectiveError",
    "PerspectiveWidget",
    "PerspectiveViewer",
    "PerspectiveTornadoHandler",
    "Table",
    "PerspectiveManager",
    "sync_client",
    "create_sync_client",
]

from .perspective import PySyncClient, PerspectiveError, PySyncServer

from .widget import PerspectiveWidget
from .viewer import PerspectiveViewer

try:
    from .handlers import PerspectiveTornadoHandler
except ImportError:
    ...


def default_loop_cb(fn, *args, **kwargs):
    return fn(*args, **kwargs)


class Server(PySyncServer):
    def set_threadpool_size(self, n_cpus):
        pass

    def new_client(self, loop_callback=default_loop_cb):
        return Client.from_server(self, loop_callback)


class Client(PySyncClient):
    def from_server(
        server: Server,
        loop_callback=default_loop_cb,
    ):
        """Create a new `Client` instance bound synchronously to an Python
        instance of `PerspectiveServer`."""

        def handle_request(bytes):
            session.handle_request(bytes)
            loop_callback(lambda: session.poll())

        def handle_response(bytes):
            client.handle_response(bytes)

        session = server.new_session(handle_response)
        client = Client(handle_request)
        return client


server = Server()
client = Client.from_server(server)
