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

__version__ = "3.7.3"
__all__ = [
    "_jupyter_labextension_paths",
    "Server",
    "Client",
    "Table",
    "View",
    "PerspectiveError",
    "ProxySession",
    "AsyncClient",
    "AsyncServer",
    "num_cpus",
    "set_num_cpus",
    "system_info",
]

import functools

from .perspective import (
    Client,
    PerspectiveError,
    ProxySession,
    Server,
    AsyncServer,
    AsyncClient,
    # NOTE: these are classes without constructors,
    # so we import them just for type hinting
    Table,  # noqa: F401
    View,  # noqa: F401
    num_cpus,
    set_num_cpus,
)


GLOBAL_SERVER = Server()
GLOBAL_CLIENT = GLOBAL_SERVER.new_local_client()


@functools.wraps(Client.table)
def table(*args, **kwargs):
    return GLOBAL_CLIENT.table(*args, **kwargs)


@functools.wraps(Client.open_table)
def open_table(*args, **kwargs):
    return GLOBAL_CLIENT.table(*args, **kwargs)


@functools.wraps(Client.get_hosted_table_names)
def get_hosted_table_names(*args, **kwargs):
    return GLOBAL_CLIENT.get_hosted_table_names(*args, **kwargs)


@functools.wraps(Client.system_info)
def system_info(*args, **kwargs):
    return GLOBAL_CLIENT.system_info(*args, **kwargs)


def _jupyter_labextension_paths():
    """
    Read by `jupyter labextension develop`
    @private
    """
    return [{"src": "labextension", "dest": "@finos/perspective-jupyterlab"}]
