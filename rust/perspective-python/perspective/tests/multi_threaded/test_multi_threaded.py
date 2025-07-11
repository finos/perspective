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

    def test_concurrent_updates_with_limit_tables_are_threadsafe(self):
        # This is a tricky tune - at time of writing, 1000 is has a >50%
        # chance of triggering this o my dev machine
        TEST_ITERATIONS = 1000
        global running
        perspective_server = Server()
        client = perspective_server.new_local_client()
        table = client.table(
            {"col{}".format(i): "integer" for i in range(100)}, limit=100
        )

        running = True

        # Create an updating thread that overlaps the index alot
        def feed(table):
            row = {"col{}".format(i): random.randint(0, 100) for i in range(100)}
            while running:
                table.update([row for _ in range(100)])

        thread = threading.Thread(target=feed, args=(table,))
        thread.start()

        results = []

        # Create a thread that serialized the table alot, checking for nulls
        def feed2(table):
            global running
            view = table.view()
            while len(results) < TEST_ITERATIONS:
                arr = view.to_arrow()
                table2 = client.table(arr)
                view2 = table2.view()
                json = view2.to_json(end_row=1)
                view2.delete()
                table2.delete()
                results.append(json)

            view.delete()
            running = False

        thread2 = threading.Thread(target=feed2, args=(table,))
        thread2.start()

        thread.join()
        thread2.join()

        assert table.size() == 100
        for result in results:
            for row in result:
                for col, val in row.items():
                    assert val is not None

        table.delete()

    def test_concurrent_view_creation_on_separate_servers_are_threadsafe(self):
        def run_perspective():
            x = 1000
            s = Server()
            c = s.new_local_client()
            t = c.table({"a": "string", "b": int})
            t.view(expressions=["//tmp\nfalse"])
            while x > 0:
                t.update([{"a": "foo", "b": 42}])
                x -= 1

        thread1 = threading.Thread(target=run_perspective, daemon=True)
        thread2 = threading.Thread(target=run_perspective, daemon=True)
        thread1.start()
        thread2.start()
        thread1.join()
        thread2.join()
