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

from perspective import (
    AsyncClient,
    AsyncServer,
    PerspectiveError,
)


import pytest
from unittest.mock import Mock


@pytest.fixture
def server():
    return AsyncServer()


@pytest.fixture
def client(server):
    async def send_request(msg):
        await sess.handle_request(msg)

    async def send_response(msg):
        await client.handle_response(msg)

    sess = server.new_session(send_response)
    client = AsyncClient(send_request)
    return client


@pytest.mark.asyncio
async def test_send_request_callback_awaited(client):
    table_names = await client.get_hosted_table_names()
    assert table_names == []


# This test also exists in the pyodide-tests/ pytest suite, with the same name.
# Unfortunately code sharing between the two test suites is currently not easy.
@pytest.mark.asyncio
async def test_async_client_kitchen_sink(client):
    """run various things on the async client"""
    table = await client.table({"a": [0]}, name="my-cool-data", limit=100)
    view = await table.view()
    # synchronous methods
    assert table.get_index() is None
    assert table.get_name() == "my-cool-data"
    limit = table.get_limit()
    assert limit == 100

    # view update callbacks
    view_updated = Mock()
    await view.on_update(view_updated)
    for i in range(1, limit):
        await table.update([{"a": i}])
        await table.size()  # force update to process
    assert (await table.size()) == limit
    assert view_updated.call_count == limit - 1
    rex = await view.to_records()
    assert rex == [{"a": i} for i in range(limit)]

    # view/table delete callbacks
    view_deleted = Mock()
    table_deleted = Mock()
    await table.on_delete(table_deleted)
    await view.on_delete(view_deleted)
    with pytest.raises(PerspectiveError) as excinfo:
        await table.delete()
    assert excinfo.match(r"Cannot delete table with views")
    await view.delete()
    view_deleted.assert_called_once()
    await table.delete()
    table_deleted.assert_called_once()
