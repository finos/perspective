################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import random
import logging
import json
from tornado import gen, ioloop, locks, websocket


class PerspectiveWebSocketClient(object):

    def __init__(self, url):
        """Create a PerspectiveWebSocketClient that mimics a Perspective Viewer
        through the wire API.

        Examples:
            >>> @gen.coroutine
            >>> def run_client(URL):
            >>>     client = PerspectiveWebSocketClient(URL)
            >>>     # Connect to the server and send the initialization message
            >>>     yield client.connect()
            >>>     # Register an on_update callback to handle new ticks
            >>>     yield client.register_on_update()
            >>>     # Run a set of messages
            >>>     yield client.start()
        """
        self.url = url
        self.client = None
        self.message_id = -1
        self.total_message_batches = 15
        self.cmds = ["table_method", "view_method"]
        self.table_methods = ["schema", "size", "update"]
        self.table_methods_mutate = ["update"]
        self.view_methods = ["schema", "column_paths", "sides", "to_json", "to_columns"]
        self.view_methods_mutate = ["on_update", "delete"]
        self.callbacks = {}

    @gen.coroutine
    def connect(self):
        """Create and maintain a websocket client to Perspective, initializing
        the connection with the `init` message."""
        self.client = yield websocket.websocket_connect(self.url)
        self.write_message({"id": self.message_id, "cmd": "init"})

    @gen.coroutine
    def write_message(self, message):
        """Wrap websocket.write_message to coerce messages to JSON-serialized
        strings from dicts, and read the next message on the websocket."""
        ioloop.IOLoop.current().add_callback(
            self.client.write_message,
            json.dumps(message)
        )
        self.message_id += 1
        yield self.read_message()

    @gen.coroutine
    def read_message(self):
        """Read messages from the WebSocket server."""
        message = yield self.client.read_message()
        try:
            response = self.parse_response(message)
            print("Received", response["id"])

            if response["id"] in self.callbacks:
                # Call the on_update callback
                ioloop.IOLoop.current().add_callback(self.callbacks[response["id"]], self)
        except AssertionError:
            logging.CRITICAL("Server returned error:", message)

    @gen.coroutine
    def start(self):
        """Run a batch of messages to the remote endpoint simulating the
        actions of a Perspective viewer in the front-end."""
        for i in range(self.total_message_batches):
            for method in self.view_methods:
                args = []

                if "to" in method:
                    args.append({
                        "start_row": random.randint(0, 500),
                        "end_row": random.randint(501, 1000)
                    })

                message = self._make_message(
                    cmd="view_method",
                    name="view",
                    method=method,
                    args=args)

                print("sending", message["id"])
                yield self.write_message(message)


    @gen.coroutine
    def run_forever(self):
        while True:
            yield self.read_message()

    @gen.coroutine
    def register_on_update(self):
        """Registers an `on_update` callback that mimics the callback of the
        viewer by requesting more metadata from the server whenever it updates,
        thereby calling back into the Tornado IOLoop on the server."""
        @gen.coroutine
        def on_update(self):
            for method in ("schema", "num_rows", "column_paths"):
                message = self._make_message(
                    cmd="view_method",
                    name="view",
                    method=method)
                print("sending_on_update", message["id"])
                yield self.write_message(message)

        # Store callbacks as they would be on the viewer - by message ID
        self.callbacks[self.message_id] = on_update

        # send the message that registers on_update
        on_update_message = self._make_message(
            "view_method",
            "view",
            "on_update",
            subscribe=True,
            callback_id="callback_1")

        print(self.callbacks)

        yield self.write_message(on_update_message)

    def parse_response(self, response):
        """Checks that the server has responded with a valid message, i.e. one
        that does not have "error" set, and return the parsed response."""
        res = json.loads(response)
        assert "error" not in res
        return res

    def _make_message(self, cmd, name, method, **kwargs):
        """Returns a message that will execute the given method on the
        server with the specified `args`."""
        msg = {
            "id": self.message_id,
            "cmd": cmd,
            "name": name,
            "method": method,
            "args": [],
        }

        for key in kwargs:
            msg[key] = kwargs[key]

        return msg

    def _make_view_message(self, message_id, name, config={}):
        """Returns a message that will create a view on the server with the
        given `name` and `config`."""
        message = {
            "id": self.message_id,
            "cmd": "view",
            "table_name": "table",
            "view_name": name,
            "config": config
        }

        return message
