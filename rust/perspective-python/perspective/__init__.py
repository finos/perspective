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

__version__ = "3.0.1"
__all__ = [
    "_jupyter_labextension_paths",
    "PerspectiveError",
    "PerspectiveWidget",
    "PerspectiveViewer",
    "PerspectiveTornadoHandler",
    "ProxySession",
    "Table",
    "View",
    "Server",
    "Client",
]

from .perspective import (
    Client as PySyncClient,
    PerspectiveError,
    Table,
    View,
    ProxySession,
)

from .widget import PerspectiveWidget
from .viewer import PerspectiveViewer

from .psp_cffi import ServerBase

try:
    from .handlers import PerspectiveTornadoHandler
except ImportError:
    ...


def default_loop_cb(fn, *args, **kwargs):
    return fn(*args, **kwargs)


class Server(ServerBase):
    def set_threadpool_size(self, n_cpus):
        pass

    def new_local_client(self, loop_callback=default_loop_cb):
        """Create a new `Client` instance bound to this in-process `Server`."""
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

        def handle_close():
            session.close()

        session = server.new_session(handle_response)
        client = Client(handle_request, handle_close)
        return client


# Read by `jupyter labextension develop`
def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "@finos/perspective-jupyterlab"}]
