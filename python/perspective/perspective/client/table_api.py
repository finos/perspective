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

from functools import partial
from .dispatch import async_queue, subscribe, unsubscribe
from .view_api import view as make_view


def table(client, data, name, index=None, limit=None):
    """Create a Perspective `Table` by posting a message to a Perspective
    server implementation through `client`, returning a `PerspectiveTableProxy`
    object whose API is entirely async and must be called with `await` or
    in a `yield`-based generator."""
    options = {}

    if index:
        options["index"] = index
    elif limit:
        options["limit"] = limit

    msg = {"cmd": "table", "name": name, "args": [data], "options": options}

    future = asyncio.Future()
    client.post(msg, future)
    return future


class PerspectiveTableProxy(object):
    def __init__(self, client, name):
        """A proxy for a Perspective `Table` object elsewhere, i.e. on a remote
        server accessible through a Websocket.

        All public API methods on this proxy are async, and must be called
        with `await` or a `yield`-based coroutine.

        Args:
            client (:obj:`PerspectiveClient`): A `PerspectiveClient` that is
                set up to send messages to a Perspective server implementation
                elsewhere.

            name (:obj:`str`): a `str` name for the Table. Automatically
                generated if using the `table` function defined above.
        """
        self._client = client
        self._name = name
        self._async_queue = partial(async_queue, self._client, self._name)
        self._subscribe = partial(subscribe, self._client, self._name)
        self._unsubscribe = partial(unsubscribe, self._client, self._name)

    def make_port(self):
        return self._async_queue("make_port", "table_method")

    def remove_port(self):
        return self._async_queue("remove_port", "table_method")

    def get_index(self):
        return self._async_queue("get_index", "table_method")

    def get_limit(self):
        return self._async_queue("get_limit", "table_method")

    def get_num_views(self):
        return self._async_queue("get_num_views", "table_method")

    def clear(self):
        return self._async_queue("clear", "table_method")

    def replace(self, data):
        return self._async_queue("replace", "table_method", data)

    def size(self):
        return self._async_queue("size", "table_method")

    def schema(self, as_string=False):
        return self._async_queue("schema", "table_method", as_string=as_string)

    def expression_schema(self, expressions, **kwargs):
        return self._async_queue("expression_schema", "table_method", expressions, **kwargs)

    def columns(self):
        return self._async_queue("columns", "table_method")

    def is_valid_filter(self, filter):
        return self._async_queue("is_valid_filter", "table_method", filter)

    def on_delete(self, callback):
        return self._subscribe("on_delete", "table_method", callback)

    def remove_delete(self, callback):
        return self._unsubscribe("remove_delete", "table_method", callback)

    def delete(self):
        return self._async_queue("delete", "table_method")

    def view(
        self,
        columns=None,
        group_by=None,
        split_by=None,
        aggregates=None,
        sort=None,
        filter=None,
        expressions=None,
    ):
        return make_view(
            self._client,
            self._name,
            columns,
            group_by,
            split_by,
            aggregates,
            sort,
            filter,
            expressions,
        )

    def update(self, data, port_id=0):
        msg = {
            "name": self._name,
            "cmd": "table_method",
            "method": "update",
            "args": [data, {"port_id": port_id}],
            "subscribe": False,
        }
        return self._client.post(msg)

    def remove(self, pkeys, port_id=0):
        msg = {
            "name": self._name,
            "cmd": "table_method",
            "method": "remove",
            "args": [pkeys, {"port_id": port_id}],
            "subscribe": False,
        }
        return self._client.post(msg)
