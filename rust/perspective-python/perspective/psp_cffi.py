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

import ctypes
import os
import platform
from typing import Callable

if "PSP_CXX_SO_PATH" in os.environ:
    lib = ctypes.CDLL(os.environ["PSP_CXX_SO_PATH"])
else:
    ext = "so"
    if platform.system().lower() == "windows":
        ext = "dll"
    arch = platform.machine().lower()
    if arch == "amd64":
        arch = "x86_64"
    dylib_name = f"{platform.system().lower()}-{arch}-libpsp.{ext}"
    lib = ctypes.CDLL(os.path.join(os.path.dirname(__file__), dylib_name))


class EncodedApiResp(ctypes.Structure):
    _pack_ = 1
    _fields_ = [
        ("data", ctypes.POINTER(ctypes.c_char)),
        ("size", ctypes.c_uint32),
        ("client_id", ctypes.c_uint32),
    ]


class EncodedApiEntries(ctypes.Structure):
    _pack_ = 1
    _fields_ = [
        ("size", ctypes.c_uint32),
        ("entries", ctypes.POINTER(EncodedApiResp)),
    ]


ProtoApiServerPtr = ctypes.c_void_p
lib.psp_new_server.restype = ProtoApiServerPtr

lib.psp_new_session.argtypes = [ProtoApiServerPtr]
lib.psp_new_session.restype = ctypes.c_uint32

lib.psp_handle_request.argtypes = [
    ProtoApiServerPtr,
    ctypes.c_uint32,
    ctypes.c_char_p,
    ctypes.c_size_t,
]
lib.psp_handle_request.restype = ctypes.POINTER(EncodedApiEntries)

lib.psp_poll.argtypes = [ProtoApiServerPtr]
lib.psp_poll.restype = ctypes.POINTER(EncodedApiEntries)

lib.psp_new_session.argtypes = [ProtoApiServerPtr]
lib.psp_new_session.restype = ctypes.c_uint32

lib.psp_close_session.argtypes = [ProtoApiServerPtr, ctypes.c_uint32]
lib.psp_close_session.restype = None

lib.psp_delete_server.argtypes = [ProtoApiServerPtr]
lib.psp_delete_server.restype = None


class Session:
    def __init__(self, server: "ServerBase"):
        self._server: "ServerBase" = server
        self._session_id = lib.psp_new_session(server._server)

    def close(self):
        lib.psp_close_session(self._server._server, self._session_id)

    def handle_request(self, bytes_msg):
        resps = lib.psp_handle_request(
            self._server._server, self._session_id, bytes_msg, len(bytes_msg)
        )
        try:
            size = resps.contents.size
            for i in range(size):
                resp = resps.contents.entries[i]
                self._server._client_cbs[resp.client_id](resp.data[: resp.size])
        finally:
            for i in range(size):
                lib.psp_free(resps.contents.entries[i].data)
            lib.psp_free(resps.contents.entries)
            lib.psp_free(resps)

    def poll(self):
        resps = lib.psp_poll(self._server._server)
        try:
            size = resps.contents.size
            for i in range(size):
                resp = resps.contents.entries[i]
                self._server._client_cbs[resp.client_id](resp.data[: resp.size])
        finally:
            for i in range(size):
                lib.psp_free(resps.contents.entries[i].data)
            lib.psp_free(resps.contents.entries)
            lib.psp_free(resps)


class ServerBase:
    def __init__(self):
        self._client_cbs: dict[str, Callable[[bytes], None]] = {}
        self._sessions: list[Session] = []
        self._server: int = lib.psp_new_server()

    def __del__(self):
        for session in self._sessions:
            del session
        lib.psp_delete_server(self._server)

    def new_session(self, cb: Callable[[bytes], None]):
        session = Session(self)
        self._client_cbs[session._session_id] = cb
        self._sessions.append(session)
        return session
