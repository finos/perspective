################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import random
import six
import tornado.ioloop
from functools import partial
from threading import Thread
from pytest import mark
from perspective import Table, PerspectiveManager
from perspective.table._state import _PerspectiveStateManager


class AsyncSentinel(object):
    """Check how many times the callback is actually being called
    on the IOLoop."""

    def __init__(self, value):
        self.value = value

    def set(self, new):
        self.value = new

    def get(self):
        return self.value


SENTINEL = AsyncSentinel(0)


def queue_process_async(table_id, state_manager, loop=None):
    """Create our own `queue_process` method that uses a Tornado IOLoop."""
    if loop:
        SENTINEL.set(SENTINEL.get() + 1)
        loop.add_callback(state_manager.call_process, table_id=table_id)


def queue_process_async_delay(table_id, state_manager, delay=0.25, loop=None):
    """Create our own `queue_process` method that uses a Tornado IOLoop."""
    if loop:
        SENTINEL.set(SENTINEL.get() + 1)
        loop.call_later(delay, state_manager.call_process, table_id=table_id)


data = [{"a": i, "b": i * 0.5, "c": str(i)} for i in range(10)]


# @mark.skipif(six.PY2, reason="Requires Python 3")
class TestAsync(object):

    @classmethod
    def setup_class(cls):
        cls.loop = tornado.ioloop.IOLoop()
        cls.loop.make_current()
        cls.wrapped_queue_process = partial(queue_process_async, loop=cls.loop)
        cls.thread = Thread(target=cls.loop.start)
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
        if six.PY2:
            return cls.loop._running
        else:
            return cls.loop.asyncio_loop.is_running()

    def setup_method(self):
        global SENTINEL
        SENTINEL = AsyncSentinel(0)

    def teardown_method(self):
        global SENTINEL
        SENTINEL = AsyncSentinel(0)

    def test_async_queue_process(self):
        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })
        manager = PerspectiveManager()
        manager._set_queue_process(TestAsync.wrapped_queue_process)
        manager.host(tbl)

        assert tbl.size() == 0

        for i in range(5):
            tbl.update([data[i]])

        # process should have been called at least once
        assert SENTINEL.get() > 0

        tbl.delete()

    def test_async_multiple_managers_queue_process(self):
        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })
        tbl2 = Table({
            "a": int,
            "b": float,
            "c": str
        })
        manager = PerspectiveManager()
        manager2 = PerspectiveManager()

        manager.host_table("tbl", tbl)
        manager2.host_table("tbl2", tbl2)

        manager._set_queue_process(TestAsync.wrapped_queue_process)
        manager2._set_queue_process(TestAsync.wrapped_queue_process)

        for i in range(5):
            tbl.update([data[i]])
            tbl2.update([data[i]])

        assert SENTINEL.get() != 0

        # flush `TO_PROCESS`
        view = tbl.view()
        assert view.to_records() == data[:5]

        for i in range(5):
            tbl2.update([data[i]])

        view.delete()
        tbl2.delete()
        tbl.delete()

    def test_async_multiple_managers_mixed_queue_process(self):
        # mutate when synchronously calling queue_process for each update
        SENTINEL_2 = AsyncSentinel(0)

        def sync_queue_process(table_id, state_manager):
            SENTINEL_2.set(SENTINEL_2.get() - 1)
            state_manager.call_process(table_id)

        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })
        tbl2 = Table({
            "a": int,
            "b": float,
            "c": str
        })
        manager = PerspectiveManager()
        manager2 = PerspectiveManager()

        manager.host_table("tbl", tbl)
        manager2.host_table("tbl2", tbl2)

        # manager uses tornado, manager2 is synchronous
        manager._set_queue_process(TestAsync.wrapped_queue_process)
        manager2._set_queue_process(sync_queue_process)

        tbl_id = tbl._table.get_id()
        tbl2_id = tbl2._table.get_id()

        for i in range(5):
            tbl.update([data[i]])
            tbl2.update([data[i]])

        assert SENTINEL.get() != 0
        assert SENTINEL_2.get() == -5

        assert tbl2_id not in _PerspectiveStateManager.TO_PROCESS

        # flush `TO_PROCESS`
        view = tbl.view()
        assert view.to_records() == data[:5]
        assert tbl_id not in _PerspectiveStateManager.TO_PROCESS

        tbl2.delete()
        view.delete()
        tbl.delete()

    def test_async_multiple_managers_delayed_process(self):
        from time import sleep
        short_delay_queue_process = partial(queue_process_async_delay,
                                            delay=0.5, loop=TestAsync.loop)
        long_delay_queue_process = partial(queue_process_async_delay,
                                           delay=1, loop=TestAsync.loop)

        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })
        tbl2 = Table({
            "a": int,
            "b": float,
            "c": str
        })
        manager = PerspectiveManager()
        manager2 = PerspectiveManager()

        manager.host_table("tbl", tbl)
        manager2.host_table("tbl2", tbl2)

        # The guarantee of `queue_process` is that eventually `_process`
        # will be called, either by user action or loop iteration. By adding
        # the delay, we can artificially queue up actions for later execution
        # and see that it's working properly.
        manager._set_queue_process(short_delay_queue_process)
        manager2._set_queue_process(long_delay_queue_process)

        tbl_id = tbl._table.get_id()
        tbl2_id = tbl2._table.get_id()

        for i in range(10):
            tbl.update([data[i]])
            tbl2.update([data[i]])

        assert SENTINEL.get() != 0

        # updates are now queued
        assert tbl_id in _PerspectiveStateManager.TO_PROCESS
        assert tbl2_id in _PerspectiveStateManager.TO_PROCESS

        # Wait for the callbacks to run - we don't call any methods
        # that would call `call_process`, but instead wait for the
        # callbacks to execute asynchronously.
        sleep(1)

        tbl2.delete()
        tbl.delete()

    def test_async_queue_process_multiple_ports(self):
        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })

        port_ids = [0]
        port_data = [{
            "a": 0,
            "b": 0,
            "c": "0"
        }]

        for i in range(10):
            port_id = tbl.make_port()
            port_ids.append(port_id)
            port_data.append({
                "a": port_id,
                "b": port_id * 1.5,
                "c": str(port_id)
            })

        assert port_ids == list(range(0, 11))

        manager = PerspectiveManager()
        manager._set_queue_process(TestAsync.wrapped_queue_process)
        manager.host(tbl)

        assert tbl.size() == 0

        random.shuffle(port_ids)

        for port_id in port_ids:
            idx = port_id if port_id < len(port_ids) else len(port_ids) - 1
            tbl.update([port_data[idx]], port_id=port_id)

        # assert that process is being called asynchronously
        assert SENTINEL.get() > 0

        tbl.delete()

    def test_async_multiple_managers_queue_process_multiple_ports(self):
        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })

        tbl2 = Table({
            "a": int,
            "b": float,
            "c": str
        })

        port_ids = [0]
        port_data = [{
            "a": 0,
            "b": 0,
            "c": "0"
        }]

        for i in range(10):
            port_id = tbl.make_port()
            port_id2 = tbl2.make_port()

            assert port_id == port_id2

            port_ids.append(port_id)
            port_data.append({
                "a": port_id,
                "b": port_id * 1.5,
                "c": str(port_id)
            })

        manager = PerspectiveManager()
        manager2 = PerspectiveManager()

        manager.host_table("tbl", tbl)
        manager2.host_table("tbl2", tbl2)

        manager._set_queue_process(TestAsync.wrapped_queue_process)
        manager2._set_queue_process(TestAsync.wrapped_queue_process)

        random.shuffle(port_ids)

        for port_id in port_ids:
            idx = port_id if port_id < len(port_ids) else len(port_ids) - 1
            tbl.update([port_data[idx]], port_id=port_id)
            tbl2.update([port_data[idx]], port_id=port_id)

        # assert that process gets called at some point
        assert SENTINEL.get() != 0

    def test_async_multiple_managers_mixed_queue_process_multiple_ports(self):
        # mutate when synchronously calling queue_process for each update
        SENTINEL_2 = AsyncSentinel(0)

        def sync_queue_process(table_id, state_manager):
            SENTINEL_2.set(SENTINEL_2.get() - 1)
            state_manager.call_process(table_id)

        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })

        tbl2 = Table({
            "a": int,
            "b": float,
            "c": str
        })

        port_ids = [0]
        port_data = [{
            "a": 0,
            "b": 0,
            "c": "0"
        }]

        for i in range(10):
            port_id = tbl.make_port()
            port_id2 = tbl2.make_port()

            assert port_id == port_id2

            port_ids.append(port_id)
            port_data.append({
                "a": port_id,
                "b": port_id * 1.5,
                "c": str(port_id)
            })

        manager = PerspectiveManager()
        manager2 = PerspectiveManager()

        manager.host_table("tbl", tbl)
        manager2.host_table("tbl2", tbl2)

        # manager uses tornado, manager2 is synchronous
        manager._set_queue_process(TestAsync.wrapped_queue_process)
        manager2._set_queue_process(sync_queue_process)

        random.shuffle(port_ids)

        for port_id in port_ids:
            idx = port_id if port_id < len(port_ids) else len(port_ids) - 1
            tbl.update([port_data[idx]], port_id=port_id)
            tbl2.update([port_data[idx]], port_id=port_id)

        assert SENTINEL.get() != 0
        assert SENTINEL_2.get() == -11

        tbl2.delete()
        tbl.delete()

    def test_async_multiple_managers_delayed_process_multiple_ports(self):
        from time import sleep
        short_delay_queue_process = partial(queue_process_async_delay,
                                            delay=0.5, loop=TestAsync.loop)
        long_delay_queue_process = partial(queue_process_async_delay,
                                           delay=1, loop=TestAsync.loop)

        tbl = Table({
            "a": int,
            "b": float,
            "c": str
        })
        tbl2 = Table({
            "a": int,
            "b": float,
            "c": str
        })
        manager = PerspectiveManager()
        manager2 = PerspectiveManager()

        manager.host_table("tbl", tbl)
        manager2.host_table("tbl2", tbl2)

        # The guarantee of `queue_process` is that eventually `_process`
        # will be called, either by user action or loop iteration. By adding
        # the delay, we can artificially queue up actions for later execution
        # and see that it's working properly.
        manager._set_queue_process(short_delay_queue_process)
        manager2._set_queue_process(long_delay_queue_process)

        tbl_id = tbl._table.get_id()
        tbl2_id = tbl2._table.get_id()

        for i in range(10):
            tbl.update([data[i]])
            tbl2.update([data[i]])

        assert SENTINEL.get() != 0

        # updates are now queued
        assert tbl_id in _PerspectiveStateManager.TO_PROCESS
        assert tbl2_id in _PerspectiveStateManager.TO_PROCESS

        # Wait for the callbacks to run - we don't call any methods
        # that would call `call_process`, but instead wait for the
        # callbacks to execute asynchronously.
        sleep(1)

        tbl2.delete()
        tbl.delete()
