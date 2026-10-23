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

import pytest

import perspective
from perspective import Client
from perspective.virtual_servers import VirtualServerHandler


class IntegerHandler(VirtualServerHandler):
    def __init__(self):
        self.kept = []
        self.errors = []

    def get_hosted_tables(self):
        return ["fixture"]

    def table_schema(self, table_name):
        return {"x": "integer"}

    def table_size(self, table_name):
        return 3

    def table_make_view(self, table_name, view_name, config):
        pass

    def view_delete(self, view_name):
        pass

    def view_get_data(self, view_name, config, schema, viewport, data):
        for i in range(3):
            data.set_col("integer", "x", i, i)


class KeepingHandler(IntegerHandler):
    def view_get_data(self, view_name, config, schema, viewport, data):
        super().view_get_data(view_name, config, schema, viewport, data)
        self.kept.append(data)


def make_client(handler):
    server = perspective.VirtualServer(handler)
    client = Client(
        lambda msg: client.handle_response(server.handle_request(msg))
    )
    return client


def fetch(handler):
    view = make_client(handler).open_table("fixture").view()
    result = view.to_columns()
    view.delete()
    return result


class TestDataSliceLifetime:
    def test_kept_slice_does_not_abort(self):
        handler = KeepingHandler()
        assert fetch(handler)["x"] == [0, 1, 2]
        assert len(handler.kept) == 1

    def test_kept_slice_raises_after_return(self):
        handler = KeepingHandler()
        fetch(handler)
        with pytest.raises(ValueError, match="view_get_data"):
            handler.kept[0].set_col("integer", "x", 0, 1)

    def test_kept_slice_raises_on_from_arrow_ipc_after_return(self):
        handler = KeepingHandler()
        fetch(handler)
        with pytest.raises(ValueError, match="view_get_data"):
            handler.kept[0].from_arrow_ipc(b"")
