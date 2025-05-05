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

from perspective import Server, Client, ProxySession, AsyncClient
import pytest


client = Server().new_local_client()
Table = client.table


data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}


class TestProxySession(object):
    def test_proxy_client(self):
        server = Server()
        client = server.new_local_client()

        def handle_request(bytes):
            sub_session.handle_request(bytes)

        def handle_response(bytes):
            sub_client.handle_response(bytes)

        sub_session = ProxySession(client, handle_response)
        sub_client = Client(handle_request, sub_session.close)
        table = sub_client.table(data, name="table1")
        assert table.schema() == {"a": "integer", "b": "string"}

    def test_proxy_and_local_client_can_share_handles(self):
        server = Server()
        client = server.new_local_client()

        def handle_request(bytes):
            sub_session.handle_request(bytes)

        def handle_response(bytes):
            sub_client.handle_response(bytes)

        sub_session = ProxySession(client, handle_response)
        sub_client = Client(handle_request, sub_session.close)
        table = sub_client.table(data, name="table1")
        table2 = client.open_table("table1")
        assert table.size() == 3
        table2.update([{"a": 4, "d": 5}])
        assert table.size() == 4

    @pytest.mark.asyncio
    async def test_handle_request_async(self):
        """tests use of ProxySession.handle_request_async() in an AsyncClient callback"""
        server = Server()
        client = server.new_local_client()

        def handle_response(bytes):
            import asyncio
            asyncio.create_task(sub_client.handle_response(bytes))

        sub_session = ProxySession(client, handle_response)
        sub_client = AsyncClient(sub_session.handle_request_async, sub_session.close)
        table = await sub_client.table(data, name="table1")
        table2 = client.open_table("table1")
        assert (await table.size()) == 3
        table2.update([{"a": 4, "d": 5}])
        assert (await table.size()) == 4

    @pytest.mark.asyncio
    async def test_dismabiguate_message_ids_in_proxy_session(self):
        """tests concurrent calls from clients on Session + ProxySession"""
        server = Server()
        client = server.new_local_client()

        def send_response(bytes):
            import asyncio

            asyncio.create_task(sub_client.handle_response(bytes))

        async def send_request(bytes):
            await sub_session.handle_request_async(bytes)
            await sub_session.poll_async()

        sub_session = ProxySession(client, send_response)
        sub_client = AsyncClient(send_request, sub_session.close)

        table = client.table("x\n1", name="test_table")
        table2 = await sub_client.open_table("test_table")
        view = table.view()
        view2 = await table2.view()

        sentinel = []

        def callback1(*args):
            sentinel.append("Callback 1")

        def callback2(*args):
            sentinel.append("Callback 2")

        view.on_update(callback1)
        await view2.on_update(callback2)
        await table2.update("x\n2")
        assert sentinel == ["Callback 1", "Callback 2"]
