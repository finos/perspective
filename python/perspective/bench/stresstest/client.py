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
from tornado import gen, websocket


class WebsocketClient(object):

    def __init__(self, url):
        self.url = url
        self.client = None
        self.message_id = -1
        self.total_messages = 25
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
        yield self.write({"id": self.message_id, "cmd": "init"})
        response = yield self.client.read_message()
        assert json.loads(response) == {"id": -1, "data": None}

    @gen.coroutine
    def write(self, message):
        """Wrap websocket.write_message to automatically increment the
        message ID and coerce messages to JSON-serialized strings from
        dicts."""
        yield self.client.write_message(json.dumps(message))
        self.message_id += 1

    @gen.coroutine
    def start(self):
        for i in range(self.total_messages):
            for method in self.view_methods:
                args = []
                if "to" in method:
                    args.append({
                        "start_row": 0,
                        "end_row": random.randint(1, 1000)
                    })
                yield self.write(self._make_message(cmd="view_method", name="view", method=method, args=args))
                response = yield self.client.read_message()
                try:
                    response = self.parse_response(response)
                    print("Received", response["id"])
                    if response["id"] in self.callbacks:
                        self.callbacks[response["id"]](self)
                except AssertionError:
                    logging.CRITICAL("failed:", response)

    @gen.coroutine
    def register_on_update(self):
        """Registers an `on_update` callback that mimics the callback of the
        viewer by requesting more metadata from the server whenever it updates,
        thereby calling back into the Tornado IOLoop on the server."""
        @gen.coroutine
        def on_update(self):
            print("called!")
            for method in ("schema", "num_rows", "column_paths"):
                yield self.write(self._make_message(cmd="view_method", name="view", method=method))

        # Store callbacks as they would be on the viewer - by message ID
        self.callbacks[self.message_id] = on_update

        # send the message that registers on_update
        yield self.write(self._make_message("view_method", "view", "on_update", subscribe=True, callback_id="callback_1"))

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
        return {
            "id": self.message_id,
            "cmd": "view",
            "table_name": "table",
            "view_name": name,
            "config": config
        }
