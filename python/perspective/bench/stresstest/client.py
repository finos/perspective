################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import six
import sys
import random
import logging
import json

from datetime import datetime, timedelta
from tornado import gen, ioloop, websocket


class PerspectiveWebSocketClient(object):

    def __init__(self, url, client_id, results_table, row_window=50, column_window=10):
        """Create a PerspectiveWebSocketClient that mimics a Perspective Viewer
        through the wire API.

        Args:
            url (:obj:`str`)
            client_id (:obj:`str`)
            results_table (:obj:`perspective.Table`)

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
        self.client_id = client_id
        self.results_table = results_table
        self.client = None

        self.pending_messages = {}

        # Each message must have a unique integer ID
        self.message_id = -1

        # The total number of messages that should be sent to the server on
        # every call to `self.run()`
        self.total_messages = 30

        # How many rows and columns should be fetched each time - allows
        # simulation of grid-like views and chart-like views
        self.row_window = row_window
        self.column_window = column_window

        self.cmds = ["table_method", "view_method"]

        # A list of views created by this client
        self.view_name = None

        # A list of messages that can be decomposed into *args for
        # self._make_message
        self.table_methods = ["schema", "size"]
        self.table_methods_mutate = ["update"]
        self.view_methods = ["schema", "computed_schema", "column_paths", "sides", "to_columns", "to_json"]
        self.view_method_iter = 0

        # `on_update` callbacks managed by this client
        self.callbacks = {}

        # Metadata about the remote table - schema, typemapped columns, and
        # column names
        self.schema = {}
        self.columns_by_type = {}
        self.column_names = []

    @gen.coroutine
    def connect(self):
        """Create and maintain a websocket client to Perspective, initializing
        the connection with the `init` message."""
        self.client = yield websocket.websocket_connect(self.url)
        yield self.write_message({"id": self.message_id, "cmd": "init"})

    @gen.coroutine
    def run(self):
        """Send random messages at intervals that simulate the actions of a
        Perspective viewer in the front-end."""
        for i in range(self.total_messages):
            message = None

            refresh_view = random.random() > 0.8

            if refresh_view:
                yield self.delete_view()
                yield self.make_view()
                continue

            cmd = "view_method" if random.random() > 0.5 else "table_method"

            if cmd == "view_method":
                method = self.view_methods[self.view_method_iter]
                args = []

                if "to" in method:
                    # simulate grid paging
                    start_row = random.randint(0, 500)
                    start_col = random.randint(0, len(self.column_names))
                    _end = start_col + self.column_window
                    end_col = _end if _end < len(self.column_names) else len(self.column_names)

                    args.append({
                        "start_row": start_row,
                        "end_row": start_row + self.row_window,
                        "start_col": start_col,
                        "end_col": end_col
                    })

                if self.view_method_iter < len(self.view_methods) - 1:
                    self.view_method_iter += 1
                else:
                    self.view_method_iter = 0

                message = self._make_message(
                    cmd=cmd,
                    name=self.view_name,
                    method=method,
                    args=args)
            else:
                method = random.choice(self.table_methods)
                message = self._make_message(
                    cmd=cmd,
                    name="table",
                    method=method)

            logging.info("Sending %s: %s, id: %s", cmd, method, message["id"])
            yield self.write_message(message)

            # sort of simulate wait times between each message
            # if random.random() > 0.75:
            #     wait_time = random.random()
            #     logging.info("Waiting for %s", wait_time)
            #     yield gen.sleep(wait_time)

    @gen.coroutine
    def run_until_timeout(self, timeout=None):
        """Run the websocket client until the timeout, which defaults to
        None and runs forever.

        Keyword Args:
            timeout (:obj:`float`/:obj:`datetime.timdelta`)
        """
        @gen.coroutine
        def _run(self, timeout):
            """Internal run callback - always run one iteration, and then
            run until specified timeout."""
            if timeout:
                ioloop.IOLoop.current().add_callback(self.run)

                end_time = datetime.now() + timeout
                logging.info("Running until %s", end_time)

                while datetime.now() <= end_time:
                    if random.random() > 0.8:
                        # inject more user actions at random
                        ioloop.IOLoop.current().add_callback(self.run)
                    yield self.read_message()

                # FIXME timeout does not prematurely exit - it waits for all
                # yields to complete first.
                logging.critical("Exiting client: timed out at %s", end_time)
                sys.exit(0)
            else:
                ioloop.IOLoop.current().add_callback(self.run)

                logging.info("Running forever")
                while True:
                    if random.random() > 0.5:
                        # inject more user actions at random
                        ioloop.IOLoop.current().add_callback(self.run)
                    yield self.read_message()

        # Connect server and initialize schema and update callback
        yield self.connect()
        yield self.get_table_schema()
        yield self.make_view()
        yield self.register_on_update()

        timeout_delta = None

        if timeout:
            timeout_delta = None
            if isinstance(timeout, six.integer_types + (float, )):
                timeout_delta = timedelta(seconds=timeout)
            elif isinstance(timeout, timedelta):
                timeout_delta = timeout

        ioloop.IOLoop.current().add_callback(_run, self, timeout_delta)

    @gen.coroutine
    def write_message(self, message):
        """Wrap websocket.write_message to coerce messages to JSON-serialized
        strings from dicts, and read the next message on the websocket."""
        meta = {}

        # fill metadata
        meta["client_id"] = self.client_id
        meta["cmd"] = message.get("cmd", None)
        meta["method"] = message.get("method", None)
        meta["args"] = json.dumps(message.get("args", None))
        meta["message_id"] = message.get("id", None)

        ioloop.IOLoop.current().add_callback(
            self.client.write_message,
            json.dumps(message)
        )

        meta["send_timestamp"] = datetime.now()
        self.message_id += 1

        if message["cmd"] != "view":
            # view creation does not yield a response
            self.pending_messages[message["id"]] = meta
            yield self.read_message()

    @gen.coroutine
    def read_message(self):
        """Read messages from the WebSocket server."""
        message = yield self.client.read_message()

        if message is None:
            raise websocket.WebSocketClosedError("The socket connection has closed!")

        try:
            response = self.parse_response(message)
            response_id = response["id"]
            logging.info("Received id: %s", response_id)
            meta = None

            if response_id in self.pending_messages:
                meta = self.pending_messages[response_id]
                meta["receive_timestamp"] = datetime.now()
                meta["time_on_wire"] = (meta["receive_timestamp"] - meta["send_timestamp"]).microseconds
                self.results_table.update([meta])
                self.pending_messages.pop(response_id)

            if response_id in self.callbacks:
                pass
                # Call the on_update callback
                # ioloop.IOLoop.current().add_callback(self.callbacks[response_id], self)

            assert "error" not in response
        except AssertionError:
            logging.critical("Server returned error:", message)

    @gen.coroutine
    def make_view(self):
        """Create a new view with a randomized config."""
        view_name = str(random.random())

        # 0/1/2 sided, 3 is column only
        sides = random.randint(0, 3)

        start_col = random.randint(0, len(self.column_names) - 1)
        end = random.randint(start_col, start_col + 5)
        end_col = end if end < len(self.column_names) else len(self.column_names)

        config = {
            "columns": self.column_names[start_col:end_col]
        }

        pivot_columns = \
            self.columns_by_type.get("string", []) + \
            self.columns_by_type.get("datetime", []) + \
            self.columns_by_type.get("date", [])

        sort_columns = \
            self.columns_by_type.get("integer", []) + \
            self.columns_by_type.get("float", [])

        if sides == 1:
            config["row_pivots"] = [random.choice(pivot_columns) for i in range(random.randint(0, 2))]
        elif sides == 2:
            config["row_pivots"] = [random.choice(pivot_columns) for i in range(random.randint(0, 2))]
            config["column_pivots"] = [random.choice(pivot_columns)]
        elif sides == 3:
            config["column_pivots"] = [random.choice(pivot_columns)]

        if random.random() > 0.5:
            config["sort"] = [[random.choice(sort_columns), "desc"]]

        logging.debug("New view config: %s", config)

        message = self._make_view_message(view_name, config)
        yield self.write_message(message)
        self.view_name = view_name

    @gen.coroutine
    def delete_view(self):
        """Delete the view that is managed by this client from the server."""
        message = self._make_message(
            cmd="view_method",
            name=self.view_name,
            method="delete"
        )

        # use the client directly because we don't care about the output
        ioloop.IOLoop.current().add_callback(
            self.client.write_message,
            json.dumps(message)
        )

        self.message_id += 1
        logging.debug("Deleted view: %s", self.view_name)
        self.view_name = None

    @gen.coroutine
    def get_table_schema(self):
        """Get the schema of the table from the server."""
        message = self._make_message(
            cmd="table_method",
            name="table",
            method="schema"
        )

        # use the client directly because we care about the output
        ioloop.IOLoop.current().add_callback(
            self.client.write_message,
            json.dumps(message)
        )

        self.message_id += 1

        response = yield self.client.read_message()
        parsed = json.loads(response)
        schema = parsed["data"]

        self.schema = schema
        self.column_names = list(schema.keys())

        for name in self.column_names:
            dtype = self.schema[name]
            if dtype not in self.columns_by_type:
                self.columns_by_type[dtype] = []
            self.columns_by_type[dtype].append(name)

    @gen.coroutine
    def register_on_update(self):
        """Registers an `on_update` callback that mimics the callback of the
        viewer by requesting more metadata from the server whenever it updates,
        thereby calling back into the Tornado IOLoop on the server."""
        @gen.coroutine
        def on_update(self):
            # Send 5 more messages back to the server whenever on_update
            # happens, with no sleep time to simulate the Viewer requesting
            # more information from the server.
            for i in range(5):
                # non-mutating methods only
                method = random.choice(("schema", "num_rows", "column_paths"))
                message = self._make_message(
                    cmd="view_method",
                    name=self.view_name,
                    method=method)

                logging.info("Sending within on_update: %s, id: %s", method, message["id"])
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

    def _make_view_message(self, name, config={}):
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
