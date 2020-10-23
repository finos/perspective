################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from functools import partial
import tornado.locks
import tornado.websocket
from tornado.gen import coroutine
from tornado.ioloop import IOLoop
from ..core.exception import PerspectiveError


class PerspectiveTornadoHandler(tornado.websocket.WebSocketHandler):
    """PerspectiveTornadoHandler is a drop-in implementation of Perspective.

    Use it inside Tornado routing to create a server-side Perspective that is
    ready to receive websocket messages from the front-end `perspective-viewer`.
    Because Tornado implements an event loop, this handler links Perspective
    with `IOLoop.current()` in order to defer expensive operations until the
    next free iteration of the event loop.

    The Perspective client and server will automatically keep the Websocket
    alive without timing out.

    Examples:
        >>> MANAGER = PerspectiveManager()
        >>> MANAGER.host_table("data_source_one", Table(
        ...     pd.read_csv("superstore.csv")))
        >>> app = tornado.web.Application([
        ...     (r"/", MainHandler),
        ...     (r"/websocket", PerspectiveTornadoHandler, {
        ...         "manager": MANAGER,
        ...         "check_origin": True
        ...     })
        ... ])
    """

    def __init__(self, *args, **kwargs):
        """Create a new instance of the PerspectiveTornadoHandler with the
        given Manager instance.

        Keyword Args:
            manager (:obj:`PerspectiveManager`): A `PerspectiveManager` instance.
                Must be provided on initialization.
            check_origin (:obj`bool`): If True, all requests will be accepted
                regardless of origin. Defaults to False.
            chunk_size (:obj:`int`): Binary messages will not exceed this length
                (in bytes);  payloads above this limit will be chunked
                across multiple messages. Defaults to `25165824` (24MB), and
                be disabled entirely with `None`.
        """
        self._manager = kwargs.pop("manager", None)
        self._check_origin = kwargs.pop("check_origin", False)
        self._chunk_size = kwargs.pop("chunk_size", 25165824)
        self._session = self._manager.new_session()
        self._stream_lock = tornado.locks.Lock()

        # https://www.tornadoweb.org/en/stable/gen.html#tornado.gen.moment
        self._chunk_sleep = kwargs.pop("_chunk_sleep", 0)

        if self._manager is None:
            raise PerspectiveError(
                "A `PerspectiveManager` instance must be provided to the tornado handler!"
            )

        super(PerspectiveTornadoHandler, self).__init__(*args, **kwargs)

    def check_origin(self, origin):
        """Returns whether the handler allows requests from origins outside
        of the host URL.

        Args:
            origin (:obj"`bool`): a boolean that indicates whether requests
                outside of the host URL should be accepted. If :obj:`True`, request
                URLs will not be validated and all requests will be allowed.
                Defaults to :obj:`False`.
        """
        return self._check_origin

    def on_message(self, message):
        """When the websocket receives a message, send it to the :obj:`process`
        method of the `PerspectiveManager` with a reference to the :obj:`post`
        callback.
        """
        if message == "ping":
            # Respond to ping heartbeats from the Websocket client.
            self.write_message("pong")
            return

        loop = IOLoop.current()
        self._session.process(message, partial(loop.add_callback, self.post))

    def post(self, message, binary=False):
        """When `post` is called by `PerspectiveManager`, serialize the data to
        JSON and send it to the client.

        Args:
            message (:obj:`str`): a JSON-serialized string containing a message to the
                front-end `perspective-viewer`.
        """
        loop = IOLoop.current()

        # Only send message in chunks if it passes the threshold set by the
        # `PerspectiveManager`.
        chunked = len(message) > self._chunk_size

        if binary and chunked:
            loop.add_callback(
                self._with_lock,
                self._post_chunked,
                message,
                0,
                self._chunk_size,
                len(message),
            )
        else:
            loop.add_callback(self._with_lock, self.write_message, message, binary)

    def on_close(self):
        """Remove the views associated with the client when the websocket
        closes.
        """
        self._session.close()

    @tornado.gen.coroutine
    def _with_lock(self, f, *args, **kwargs):
        """A python2-compatible, tornado-async-friendly lock wrapper which
        serializes access of `f`, used to block responses from future messages
        from interleaving binary streams.
        """
        yield self._stream_lock.acquire()
        try:
            yield f(*args, **kwargs)
        except tornado.websocket.WebSocketClosedError:
            pass
        finally:
            yield self._stream_lock.release()

    @coroutine
    def _post_chunked(self, message, start, end, message_length):
        """Send a binary message in chunks on the websocket."""
        if start < message_length:
            end = start + self._chunk_size

            if end >= message_length:
                end = message_length

            self.write_message(message[start:end], binary=True)
            start = end

            # Allow the loop to process heartbeats so that client sockets don't
            # get closed in the middle of sending a chunk.
            yield tornado.gen.sleep(self._chunk_sleep)
            yield self._post_chunked(message, start, end, message_length)
