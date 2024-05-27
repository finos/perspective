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

from asyncio import AbstractEventLoop
from typing import Optional
from .perspective import *
import types
import sys

# LEGACY API

sync_client = create_sync_client()

import asyncio
import threading

_shared_async_client = None
_client_loop: asyncio.AbstractEventLoop = None
_client_thread: threading.Thread = None
_loop_ready: threading.Event = threading.Event()

def create_async_client_thread():
    global _client_loop
    _client_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_client_loop)
    _loop_ready.set()
    _client_loop.run_forever()

def create_async_client_sync():
    if not _client_loop.is_running():
        _loop_ready.wait()
    async def inner():
        return await create_async_client()
    future = asyncio.run_coroutine_threadsafe(inner(), _client_loop)
    return future.result()

def run_blocking(func):
    if not _client_loop.is_running():
        _loop_ready.wait()
    return asyncio.run_coroutine_threadsafe(func(), _client_loop).result()

def shared_async_client():
    global _shared_async_client
    global _client_thread
    if _shared_async_client is None:
        if _client_thread is None:
            _client_thread = threading.Thread(target=create_async_client_thread)
            _client_thread.daemon = True
            _client_thread.start()
            _loop_ready.wait()
        _shared_async_client = create_async_client_sync()
    return _shared_async_client


class SyncTable:
    def __init__(self, *args, **kwargs):
        client = shared_async_client()
        async def inner():
            return await client.table(*args, **kwargs)
        self._table = asyncio.run_coroutine_threadsafe(inner(), _client_loop).result()

    def __getattribute__(self, name: str):
        table = object.__getattribute__(self, '_table')
        attr = object.__getattribute__(table, name)
        
        
        # if asyncio.iscoroutinefunction(attr):
        def sync_wrapper(*args, **kwargs):
            async def a():
                res = await attr(*args, **kwargs)
                if isinstance(res, PyAsyncView):
                    return SyncView(res)
                return res
            return run_blocking(a)
        return sync_wrapper

class SyncView:
    def __init__(self, view):
        self._view = view
    
    def to_dict(self, *args, **kwargs):
        return self.to_columns(*args, **kwargs)
    
    def to_records(self, *args, **kwargs):
        return self.to_json(*args, **kwargs)

    def __getattr__(self, name: str):
        view = object.__getattribute__(self, '_view')
        attr = object.__getattribute__(view, name)
        def sync_wrapper(*args, **kwargs):
            async def inner():
                res = await attr(*args, **kwargs)
                return res
            return run_blocking(inner)
        return sync_wrapper
    
table_mod = types.ModuleType("perspective.table")
table_mod.Table = SyncTable
sys.modules.setdefault("perspective.table", table_mod)

Table = SyncTable
PerspectiveManager = create_async_client

async_client = create_async_client

def set_threadpool_size(num_cpus):
    pass


