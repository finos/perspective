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

import duckdb
import pytest

from perspective import Client
from perspective.virtual_servers.duckdb import DuckDBVirtualServer


def table_names(db):
    return {
        row[0]
        for row in db.execute(
            "SELECT table_name FROM information_schema.tables"
        ).fetchall()
    }


def make_db():
    db = duckdb.connect(":memory:")
    db.execute("CREATE TABLE data AS SELECT * FROM range(10) t(x)")
    return db


def make_session(db):
    server = DuckDBVirtualServer(db)

    def handle_request(msg):
        session.handle_request(msg)

    def handle_response(msg):
        client.handle_response(msg)

    session = server.new_session(handle_response)
    client = Client(handle_request)
    return session, client


class TestVirtualSessionClose:
    def test_close_deletes_open_views(self):
        db = make_db()
        session, client = make_session(db)
        table = client.open_table("memory.data")
        table.view(group_by=["x"])
        table.view()
        assert len(table_names(db)) == 3
        session.close()
        assert table_names(db) == {"data"}

    def test_close_skips_deleted_views(self):
        db = make_db()
        session, client = make_session(db)
        view = client.open_table("memory.data").view()
        view.delete()
        session.close()
        assert table_names(db) == {"data"}

    def test_close_without_views(self):
        db = make_db()
        session, _ = make_session(db)
        session.close()
        assert table_names(db) == {"data"}

    def test_bundled_sessions_close(self):
        from perspective.virtual_servers.clickhouse import ClickhouseVirtualSession
        from perspective.virtual_servers.duckdb import DuckDBVirtualSession
        from perspective.virtual_servers.polars import PolarsVirtualSession

        for session in [
            ClickhouseVirtualSession,
            DuckDBVirtualSession,
            PolarsVirtualSession,
        ]:
            assert callable(getattr(session, "close", None))

    def test_postgres_session_close(self):
        pytest.importorskip("psycopg")
        from perspective.virtual_servers.postgres import PostgresVirtualSession

        assert callable(getattr(PostgresVirtualSession, "close", None))


class TestStarletteDisconnect:
    def test_disconnect_closes_virtual_session(self):
        websockets = pytest.importorskip("starlette.websockets")
        from perspective.handlers.starlette import PerspectiveStarletteHandler

        class DisconnectingWebSocket:
            async def accept(self):
                pass

            async def receive_bytes(self):
                raise websockets.WebSocketDisconnect(1000)

            async def send_bytes(self, msg):
                pass

        db = make_db()
        server = DuckDBVirtualServer(db)

        async def run():
            handler = PerspectiveStarletteHandler(
                perspective_server=server, websocket=DisconnectingWebSocket()
            )
            await handler.run()

        with pytest.raises(websockets.WebSocketDisconnect):
            asyncio.run(run())
