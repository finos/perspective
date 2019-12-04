################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
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
        loop.add_callback(state_manager.clear_process, table_id=table_id)


data = [{"a": i, "b": i * 0.5, "c": str(i)} for i in range(10)]


@mark.skipif(six.PY2, reason="Requires Python 3")
class TestAsync(object):

    @classmethod
    def setup_class(cls):
        cls.loop = tornado.ioloop.IOLoop()
        cls.loop.make_current()
        cls.wrapped_queue_process = partial(queue_process_async, loop=cls.loop)
        cls.thread = Thread(target=cls.loop.start)
        cls.thread.start()
        assert cls.loop.asyncio_loop.is_running() is True

    @classmethod
    def teardown_class(cls):
        tornado.ioloop.IOLoop.current().stop()
        cls.loop.add_callback(cls.loop.stop)
        cls.loop.clear_current()
        # cls.loop.close(all_fds=True)

    def setup_method(self):
        global SENTINEL
        SENTINEL = AsyncSentinel(0)

    def teardown_method(self):
        global SENTINEL
        SENTINEL = AsyncSentinel(0)

    def test_async_queue_process(self):
        assert TestAsync.loop.asyncio_loop.is_running() is True
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

        table_id = tbl._table.get_id()
        pool = tbl._table.get_pool()

        # the first call to `update` sets process - the rest are no-ops
        assert SENTINEL.get() == 1

        assert _PerspectiveStateManager.TO_PROCESS == {
            table_id: pool
        }
        assert tbl.view().to_records() == data[:5]

        # should have flushed the process queue
        assert _PerspectiveStateManager.TO_PROCESS == {}

    def test_async_multiple_managers_queue_process(self):
        assert TestAsync.loop.asyncio_loop.is_running() is True
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

        # flush `TO_PROCESS`
        assert tbl.view().to_records() == data[:5]

        for i in range(5):
            tbl2.update([data[i]])

    def test_async_multiple_managers_mixed_queue_process(self):
        assert TestAsync.loop.asyncio_loop.is_running() is True
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

        tbl_id = tbl._table.get_id()
        tbl2_id = tbl2._table.get_id()

        for i in range(5):
            tbl.update([data[i]])
            tbl2.update([data[i]])

        assert tbl2_id not in _PerspectiveStateManager.TO_PROCESS

        # flush `TO_PROCESS`
        assert tbl.view().to_records() == data[:5]
        assert tbl_id not in _PerspectiveStateManager.TO_PROCESS
