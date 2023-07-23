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

from random import random
from functools import partial
from .dispatch import async_queue, subscribe, unsubscribe


def view(
    client,
    table_name,
    columns=None,
    group_by=None,
    split_by=None,
    aggregates=None,
    sort=None,
    filter=None,
    expressions=None,
):
    """Create a new View by posting a message to the Perspective server
    implementation through `client`, returning a Future that will resolve to a
    `PerspectiveViewProxy` object whose API must be called with `await` or
    `yield`, or an Exception if the View creation failed.
    """
    name = str(random())

    config = {
        "columns": columns,
        "group_by": group_by,
        "split_by": split_by,
        "aggregates": aggregates,
        "sort": sort,
        "filter": filter,
        "expressions": expressions,
    }

    msg = {
        "cmd": "view",
        "view_name": name,
        "table_name": table_name,
        "config": config,
    }

    future = asyncio.Future()
    client.post(msg, future)
    return future


class PerspectiveViewProxy(object):
    def __init__(self, client, name):
        """A proxy for a Perspective `View` object elsewhere, i.e. on a remote
        server accessible through a Websocket.

        All public API methods on this proxy are async, and must be called
        with `await` or a `yield`-based coroutine.

        Args:
            client (:obj:`PerspectiveClient`): A `PerspectiveClient` that is
                set up to send messages to a Perspective server implementation
                elsewhere.

            name (:obj:`str`): a `str` name for the View. Automatically
                generated if using the `view` function defined above.
        """
        self._client = client
        self._name = name
        self._async_queue = partial(async_queue, self._client, self._name)
        self._subscribe = partial(subscribe, self._client, self._name)
        self._unsubscribe = partial(unsubscribe, self._client, self._name)

    def get_config(self):
        return self._async_queue("get_config", "view_method")

    def sides(self):
        return self._async_queue("sides", "view_method")

    def num_rows(self):
        return self._async_queue("num_rows", "view_method")

    def num_columns(self):
        return self._async_queue("num_columns", "view_method")

    def get_min_max(self):
        return self._async_queue("get_min_max", "view_method")

    def get_row_expanded(self, idx):
        return self._async_queue("get_row_expanded", "view_method", idx)

    def expand(self, idx):
        return self._async_queue("expand", "view_method", idx)

    def collapse(self, idx):
        return self._async_queue("collapse", "view_method", idx)

    def set_depth(self, idx):
        return self._async_queue("set_depth", "view_method", idx)

    def column_paths(self):
        return self._async_queue("column_paths", "view_method")

    def schema(self, as_string=False):
        return self._async_queue("schema", "view_method", as_string=as_string)

    def expression_schema(self, as_string=False):
        return self._async_queue("expression_schema", "view_method", as_string=as_string)

    def on_update(self, callback, mode=None):
        return self._subscribe("on_update", "view_method", callback, mode=mode)

    def remove_update(self, callback):
        return self._unsubscribe("remove_update", "view_method", callback)

    def on_delete(self, callback):
        return self._subscribe("on_delete", "view_method", callback)

    def remove_delete(self, callback):
        return self._unsubscribe("remove_delete", "view_method", callback)

    def delete(self):
        return self._async_queue("delete", "view_method")

    def to_arrow(self, **kwargs):
        return self._async_queue("to_arrow", "view_method", **kwargs)

    def to_records(self, **kwargs):
        return self._async_queue("to_records", "view_method", **kwargs)

    def to_dict(self, **kwargs):
        return self._async_queue("to_dict", "view_method", **kwargs)

    def to_numpy(self, **kwargs):
        return self._async_queue("to_numpy", "view_method", **kwargs)

    def to_df(self, **kwargs):
        return self._async_queue("to_df", "view_method", **kwargs)

    def to_csv(self, **kwargs):
        return self._async_queue("to_csv", "view_method", **kwargs)

    def to_json(self, **kwargs):
        return self._async_queue("to_json", "view_method", **kwargs)

    def to_columns(self, **kwargs):
        return self._async_queue("to_columns", "view_method", **kwargs)

    def to_columns_string(self, **kwargs):
        return self._async_queue("to_columns_string", "view_method", **kwargs)
