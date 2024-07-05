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

import queue
import random
import threading
from functools import partial

import tornado.ioloop
from perspective import PerspectiveError, PerspectiveManager, Table, create_sync_client
from pytest import mark, raises


def syncify(f):
    """Given a function `f` that must be run on `TestAsync.loop`, queue `f` on
    the loop, block until it is evaluated, and return the result.
    """
    sem = queue.Queue()

    def _syncify_task():
        assert threading.current_thread().ident == TestAsync.thread.ident
        result = f()
        TestAsync.loop.add_callback(lambda: sem.put(result))

    def _syncify():
        TestAsync.loop.add_callback(_syncify_task)
        return sem.get()

    return _syncify


data = [{"a": i, "b": i * 0.5, "c": str(i)} for i in range(10)]


class TestAsync(object):
    @classmethod
    def setup_class(cls):
        cls.loop = tornado.ioloop.IOLoop()
        cls.loop.make_current()
        cls.thread = threading.Thread(target=cls.loop.start)
        cls.thread.daemon = True
        cls.thread.start()

    @classmethod
    def teardown_class(cls):
        cls.loop.add_callback(lambda: tornado.ioloop.IOLoop.current().stop())
        cls.loop.clear_current()
        cls.thread.join()
        cls.loop.close(all_fds=True)

    @classmethod
    def loop_is_running(cls):
        return cls.loop.asyncio_loop.is_running()

    def test_async_queue_process(self):
        client = create_sync_client(TestAsync.loop.add_callback)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})

        @syncify
        def _task():
            assert tbl.size() == 0
            for i in range(5):
                tbl.update([data[i]])
            return tbl.size()

        assert _task() == 5
        tbl.delete()

    def test_async_queue_process_csv(self):
        """Make sure GIL release during CSV loading works"""
        client = create_sync_client(TestAsync.loop.add_callback)
        tbl = client.table("x,y,z\n1,a,true\n2,b,false\n3,c,true\n4,d,false")

        @syncify
        def _task():
            assert tbl.size() == 4
            for i in range(5):
                tbl.update("x,y,z\n1,a,true\n2,b,false\n3,c,true\n4,d,false")
            return tbl.size()

        assert _task() == 24

        tbl.delete()

    def test_async_call_loop(self):
        client = create_sync_client(TestAsync.loop.add_callback)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})
        tbl.update(data)

        @syncify
        def _task():
            return tbl.size()

        assert _task() == 10
        tbl.delete()

    @mark.skip(reason="We take a loop to construct the client now")
    def test_async_call_loop_error_if_no_loop(self):
        client = create_sync_client(TestAsync.loop.add_callback)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})

        with raises(PerspectiveError):
            # loop not set - errors
            tbl.update(data)

        tbl.update(data)

        @syncify
        def _task():
            return tbl.size()

        # subsequent calls to call_loop will work if loop_callback is set.
        assert _task() == 10

        tbl.delete()

    def test_async_multiple_managers_queue_process(self):
        client = create_sync_client(TestAsync.loop.add_callback)
        client2 = create_sync_client(TestAsync.loop.add_callback)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})
        tbl2 = client2.table({"a": "integer", "b": "float", "c": "string"})

        @syncify
        def _update_task():
            for i in range(5):
                tbl.update([data[i]])
                tbl2.update([data[i]])
            return tbl.size()

        assert _update_task() == 5

        @syncify
        def _flush_to_process():
            view = tbl2.view()
            records = view.to_records()
            for i in range(5):
                tbl2.update([data[i]])

            view.delete()
            return records

        assert _flush_to_process() == data[:5]

        @syncify
        def _delete_task():
            tbl2.delete()
            tbl.delete()

        _delete_task()

    @mark.skip(
        reason="This test is failing because we're not calling process after each update like before"
    )
    def test_async_multiple_managers_mixed_queue_process(self):
        sentinel = {"called": 0}

        def sync_queue_process(f, *args, **kwargs):
            sentinel["called"] += 1
            f(*args, **kwargs)

        client = create_sync_client(TestAsync.loop.add_callback)
        client2 = create_sync_client(sync_queue_process)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})
        tbl2 = client2.table({"a": "integer", "b": "float", "c": "string"})

        @syncify
        def _tbl_task():
            for i in range(5):
                tbl.update([data[i]])
            return tbl.size()

        assert _tbl_task() == 5

        for i in range(5):
            tbl2.update([data[i]])

        assert sentinel["called"] == 5

        @syncify
        def _tbl_task2():
            view = tbl.view()
            records = view.to_records()
            view.delete()
            tbl.delete()
            return records

        assert _tbl_task2() == data[:5]

        view = tbl2.view()
        assert view.to_records() == data[:5]

        view.delete()
        tbl2.delete()

    @mark.skip(
        reason="This test is failing because we're not calling process after each update like before"
    )
    def test_async_multiple_managers_delayed_process(self):
        sentinel = {"async": 0, "sync": 0}

        def _counter(key, f, *args, **kwargs):
            sentinel[key] += 1
            return f(*args, **kwargs)

        short_delay_queue_process = partial(_counter, "sync")
        long_delay_queue_process = partial(
            TestAsync.loop.add_timeout, 1, _counter, "async"
        )

        client = create_sync_client(short_delay_queue_process)
        client2 = create_sync_client(long_delay_queue_process)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})
        tbl2 = client2.table({"a": "integer", "b": "float", "c": "string"})

        @syncify
        def _tbl_task():
            for i in range(10):
                tbl2.update([data[i]])

        _tbl_task()
        for i in range(10):
            tbl.update([data[i]])

        @syncify
        def _tbl_task2():
            size = tbl2.size()
            tbl2.delete()
            return size

        assert _tbl_task2() == 10
        assert tbl.size() == 10
        assert sentinel["async"] == 1
        assert sentinel["sync"] == 10

        tbl.delete()

    def test_async_single_manager_tables_chained(self):
        def call_loop(fn, *args):
            TestAsync.loop.add_callback(fn, *args)

        client = create_sync_client(call_loop)
        columns = {"index": "integer", "num1": "integer", "num2": "integer"}
        # tbl = client.table(columns, index="index")
        tbl = client.table(columns)
        view = tbl.view()
        tbl2 = client.table(view.to_arrow())

        def _update(port_id, delta):
            print("Updating tbl2", delta)
            tbl2.update(delta)

        view.on_update(_update, mode="row")
        for i in range(1000):
            call_loop(tbl.update, [{"index": i, "num1": i, "num2": 2 * i}])
            i += 1

        call_loop(tbl.size)

        q = queue.Queue()
        call_loop(q.put, True)
        q.get()

        @syncify
        def _tbl_task2():
            size = tbl2.size()
            return size

        assert _tbl_task2() == 1000
        # assert tbl2.size() == 1000
        view.delete()
        tbl.delete()
        tbl2.delete()

    def test_async_queue_process_multiple_ports(self):
        client = create_sync_client(TestAsync.loop.add_callback)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})
        port_ids = [0]
        port_data = [{"a": 0, "b": 0, "c": "0"}]

        for i in range(10):
            port_id = tbl.make_port()
            port_ids.append(port_id)
            port_data.append({"a": port_id, "b": port_id * 1.5, "c": str(port_id)})

        assert port_ids == list(range(0, 11))

        assert syncify(lambda: tbl.size())() == 0

        random.shuffle(port_ids)

        @syncify
        def _tbl_task():
            for port_id in port_ids:
                idx = port_id if port_id < len(port_ids) else len(port_ids) - 1
                tbl.update([port_data[idx]], port_id=port_id)
            size = tbl.size()
            tbl.delete()
            return size

        assert len(port_ids) == 11
        assert _tbl_task() == 11

    def test_async_multiple_managers_queue_process_multiple_ports(self):
        client = create_sync_client(TestAsync.loop.add_callback)
        client2 = create_sync_client(TestAsync.loop.add_callback)
        tbl = client.table({"a": "integer", "b": "float", "c": "string"})
        tbl2 = client2.table({"a": "integer", "b": "float", "c": "string"})
        port_ids = [0]
        port_data = [{"a": 0, "b": 0, "c": "0"}]

        for i in range(10):
            port_id = tbl.make_port()
            port_id2 = tbl2.make_port()
            assert port_id == port_id2
            port_ids.append(port_id)
            port_data.append({"a": port_id, "b": port_id * 1.5, "c": str(port_id)})

        @syncify
        def _task():
            random.shuffle(port_ids)
            for port_id in port_ids:
                idx = port_id if port_id < len(port_ids) else len(port_ids) - 1
                tbl.update([port_data[idx]], port_id=port_id)
                tbl2.update([port_data[idx]], port_id=port_id)
            return (tbl.size(), tbl2.size())

        assert _task() == (11, 11)

    @mark.skip(
        reason="This test is failing because we're not calling process after each update like before"
    )
    def test_async_multiple_managers_mixed_queue_process_multiple_ports(self):
        sentinel = {"async": 0, "sync": 0}

        def _counter(key, f, *args, **kwargs):
            sentinel[key] += 1
            return f(*args, **kwargs)

        sync_process = partial(_counter, "sync")
        async_process = partial(TestAsync.loop.add_timeout, 1, _counter, "async")
        sync_client = create_sync_client(sync_process)
        async_client = create_sync_client(async_process)
        tbl = async_client.table({"a": "integer", "b": "float", "c": "string"})
        tbl2 = sync_client.table({"a": "integer", "b": "float", "c": "string"})
        port_ids = [0]
        port_data = [{"a": 0, "b": 0, "c": "0"}]

        for i in range(10):
            port_id = tbl.make_port()
            port_id2 = tbl2.make_port()
            assert port_id == port_id2
            port_ids.append(port_id)
            port_data.append({"a": port_id, "b": port_id * 1.5, "c": str(port_id)})

        random.shuffle(port_ids)

        @syncify
        def _task():
            for port_id in port_ids:
                idx = port_id if port_id < len(port_ids) else len(port_ids) - 1
                tbl.update([port_data[idx]], port_id=port_id)

        _task()
        for port_id in port_ids:
            idx = port_id if port_id < len(port_ids) else len(port_ids) - 1
            tbl2.update([port_data[idx]], port_id=port_id)

        @syncify
        def _get_size():
            size = tbl.size()
            tbl.delete()
            return size

        assert _get_size() == 11
        assert tbl2.size() == 11
        assert sentinel["async"] == 1
        assert sentinel["sync"] == 11
        tbl2.delete()
