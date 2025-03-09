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

from perspective import Server

import asyncio
import random
import threading


class TestServer(object):
    def test_sync_updates_with_loop_callback_are_sync(self):
        def feed(table):
            y = 1000
            while y > 0:
                y -= 1
                table.update([{"a": random.randint(0, 10), "index": y}])

        perspective_server = Server()
        loop = asyncio.new_event_loop()
        thread = threading.Thread(target=loop.run_forever)
        thread.start()

        client = perspective_server.new_local_client()
        table = client.table(
            {"a": "integer", "index": "integer"}, index="index", name="test"
        )

        view = table.view()
        global count
        count = 0

        def update(x):
            global count
            count += 1

        view.on_update(update)
        feed(table)
        assert table.size() == 1000
        assert count == 1000
        loop.call_soon_threadsafe(loop.stop)
        thread.join()
        loop.close()

    def test_concurrent_updates(self):
        async def feed(table, loop):
            y = 1000
            while y > 0:
                y -= 1
                table.update([{"a": random.randint(0, 10), "index": y}])
                await asyncio.sleep(0.001)

        perspective_server = Server()
        loop = asyncio.new_event_loop()
        thread = threading.Thread(target=loop.run_forever)
        thread.start()

        client = perspective_server.new_local_client()
        table = client.table(
            {"a": "integer", "index": "integer"}, index="index", name="test"
        )

        view = table.view()
        global count
        count = 0

        def update(x):
            global count
            count += 1

        view.on_update(update)
        asyncio.run_coroutine_threadsafe(feed(table, loop), loop).result()
        assert table.size() == 1000
        assert count == 1000
        loop.call_soon_threadsafe(loop.stop)
        thread.join()
        loop.close()
