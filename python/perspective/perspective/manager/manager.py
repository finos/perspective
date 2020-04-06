################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import logging
import json
import random
import string
import datetime
from functools import partial
from ..core.exception import PerspectiveError
from ..table._callback_cache import _PerspectiveCallBackCache
from ..table._date_validator import _PerspectiveDateValidator
from ..table import Table, PerspectiveCppError
from ..table.view import View
from .session import PerspectiveSession

_date_validator = _PerspectiveDateValidator()


class DateTimeEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return _date_validator.to_timestamp(obj)
        else:
            return super(DateTimeEncoder, self).default(obj)


def gen_name(size=10, chars=string.ascii_uppercase + string.digits):
    return "".join(random.choice(chars) for x in range(size))


class PerspectiveManager(object):
    '''PerspectiveManager is an orchestrator for running Perspective on the
    server side.

    The core functionality resides in `process()`, which receives
    JSON-serialized messages from a client (usually `perspective-viewer` in the
    browser), executes the commands in the message, and returns the results of
    those commands back to the `post_callback`.  The manager cannot create
    tables or views - use `host_table` or `host_view` to pass Table/View
    instances to the manager.  Because Perspective is designed to be used in a
    shared context, i.e. multiple clients all accessing the same `Table`,
    PerspectiveManager comes with the context of `sessions` - an
    encapsulation of the actions and resources used by a single connection
    to Perspective.

    - When a client connects, for example through a websocket, a new session
        should be spawned using `new_session()`.
    - When the websocket closes, call `close()` on the session instance to
        clean up associated resources.
    '''

    # Commands that should be blocked from execution when the manager is in
    # `locked` mode, i.e. its tables and views made immutable from remote
    # modification.
    LOCKED_COMMANDS = ["table", "update", "remove", "replace", "clear"]

    def __init__(self, lock=False):
        self._tables = {}
        self._views = {}
        self._callback_cache = _PerspectiveCallBackCache()
        self._queue_process_callback = None
        self._lock = lock

    def lock(self):
        """Block messages that can mutate the state of `Table`s and `View`s
        under management.

        All `PerspectiveManager`s exposed over the internet should be locked to
        prevent content from being mutated by clients.
        """
        self._lock = True

    def unlock(self):
        """Unblock messages that can mutate the state of `Table`s and `View`s
        under management."""
        self._lock = False

    def host(self, item, name=None):
        """Given a :obj:`~perspective.Table` or :obj:`~perspective.View`,
        place it under management and allow operations on it to be passed
        through the Manager instance.

        Args:
            table_or_view (:obj:`~perspective.Table`/:obj:`~perspective.View`) :
                a Table or View to be managed.

        Keyword Args:
            name (:obj:`str`) : an optional name to allow retrieval through
                `get_table` or `get_view`. A name will be generated if not
                provided.
        """
        name = name or gen_name()
        if isinstance(item, Table):
            self.host_table(name, item)
        elif isinstance(item, View):
            self.host_view(name, item)
        else:
            raise PerspectiveError(
                "Only `Table()` and `View()` instances can be hosted.")

    def host_table(self, name, table):
        '''Given a reference to a `Table`, manage it and allow operations on it
        to occur through the Manager.

        If a function for `queue_process` is defined (i.e., by
        :obj:`~perspective.PerspectiveTornadoHandler`), bind the function to
        `Table` and have it call the manager's version of `queue_process`.
        '''
        if self._queue_process_callback is not None:
            # always bind the callback to the table's state manager
            table._state_manager.queue_process = partial(
                self._queue_process_callback, state_manager=table._state_manager)
        self._tables[name] = table
        return name

    def host_view(self, name, view):
        '''Given a :obj:`~perspective.View`, add it to the manager's views
        container.
        '''
        self._views[name] = view

    def get_table(self, name):
        '''Return a table under management by name.'''
        return self._tables.get(name, None)

    def get_view(self, name):
        '''Return a view under management by name.'''
        return self._views.get(name, None)

    def new_session(self):
        return PerspectiveSession(self)

    def _set_queue_process(self, func):
        """For each table under management, bind `func` to the table's state
        manager and to run whenever `queue_process` is called.

        After this method is called, future Tables hosted on this manager
        instance will call the same `queue_process` callback.
        """
        self._queue_process_callback = func
        for table in self._tables.values():
            table._state_manager.queue_process = partial(
                self._queue_process_callback, state_manager=table._state_manager)

    def _process(self, msg, post_callback, client_id=None):
        '''Given a message from the client, process it through the Perspective
        engine.

        Args:
            msg (:obj`dict`): a message from the client with instructions
                that map to engine operations
            post_callback (:obj`callable`): a function that returns data to the
                client. `post_callback` should be a callable that takes two
                parameters: `data` (str), and `binary` (bool), a kwarg that
                specifies whether `data` is a binary string.
        '''
        if isinstance(msg, str):
            if msg == "heartbeat":   # TODO fix this
                return
            msg = json.loads(msg)

        if not isinstance(msg, dict):
            raise PerspectiveError(
                "Message passed into `_process` should either be a "
                "JSON-serialized string or a dict.")

        cmd = msg["cmd"]

        if self._is_locked_command(msg) is True:
            error_message = "`{0}` failed - access denied".format(
                msg["cmd"] + (("." + msg["method"]) if msg.get("method", None) is not None else ""))
            post_callback(json.dumps(self._make_error_message(
                msg["id"], error_message), cls=DateTimeEncoder))
            return

        try:
            if cmd == "init":
                # return empty response
                post_callback(
                    json.dumps(
                        self._make_message(
                            msg["id"],
                            None),
                        cls=DateTimeEncoder))
            elif cmd == "table":
                try:
                    # create a new Table and track it
                    data_or_schema = msg["args"][0]
                    self._tables[msg["name"]] = Table(
                        data_or_schema, **msg.get("options", {}))
                except IndexError:
                    self._tables[msg["name"]] = []
            elif cmd == "view":
                # create a new view and track it with the assigned client_id.
                new_view = self._tables[msg["table_name"]].view(
                    **msg.get("config", {}))
                new_view._client_id = client_id
                self._views[msg["view_name"]] = new_view
            elif cmd == "table_method" or cmd == "view_method":
                self._process_method_call(msg, post_callback, client_id)
        except(PerspectiveError, PerspectiveCppError) as e:
            # Catch errors and return them to client
            post_callback(
                json.dumps(
                    self._make_error_message(
                        msg["id"],
                        str(e))),
                cls=DateTimeEncoder)

    def _process_method_call(self, msg, post_callback, client_id):
        '''When the client calls a method, validate the instance it calls on
        and return the result.
        '''
        if msg["cmd"] == "table_method":
            table_or_view = self._tables.get(msg["name"], None)
        else:
            table_or_view = self._views.get(msg["name"], None)
            if table_or_view is None:
                post_callback(
                    json.dumps(
                        self._make_error_message(
                            msg["id"],
                            "View is not initialized"),
                        cls=DateTimeEncoder))
        try:
            if msg.get("subscribe", False) is True:
                self._process_subscribe(
                    msg, table_or_view, post_callback, client_id)
            else:
                args = {}
                if msg["method"] == "schema":
                    # make sure schema returns string types
                    args["as_string"] = True
                elif msg["method"].startswith("to_"):
                    # parse options in `to_format` calls
                    for d in msg.get("args", []):
                        args.update(d)
                else:
                    args = msg.get("args", [])

                if msg["method"] == "delete" and msg["cmd"] == "view_method":
                    # views can be removed, but tables cannot
                    self._views[msg["name"]].delete()
                    self._views.pop(msg["name"], None)
                    return

                if msg["method"].startswith("to_"):
                    # to_format takes dictionary of options
                    result = getattr(table_or_view, msg["method"])(**args)
                elif msg["method"] != "delete":
                    # otherwise parse args as list
                    result = getattr(table_or_view, msg["method"])(*args)
                if isinstance(result, bytes) and msg["method"] != "to_csv":
                    # return a binary to the client without JSON serialization,
                    # i.e. when we return an Arrow. If a method is added that
                    # returns a string, this condition needs to be updated as
                    # an Arrow binary is both `str` and `bytes` in Python 2.
                    self._process_bytes(result, msg, post_callback)
                else:
                    # return the result to the client
                    post_callback(json.dumps(self._make_message(
                            msg["id"], result), cls=DateTimeEncoder))
        except Exception as error:
            post_callback(json.dumps(self._make_error_message(
                msg["id"], str(error)), cls=DateTimeEncoder))

    def _process_subscribe(self, msg, table_or_view, post_callback, client_id):
        '''When the client attempts to add or remove a subscription callback,
        validate and perform the requested operation.

        Args:
            msg (dict): the message from the client
            table_or_view {Table|View} : the instance that the subscription
                will be called on.
            post_callback (callable): a method that notifies the client with
                new data.
            client_id (str) : a unique str id that identifies the
                `PerspectiveSession` object that is passing the message.
        '''
        try:
            callback = None
            callback_id = msg.get("callback_id", None)
            method = msg.get("method", None)
            args = msg.get("args", [])
            if method and method[:2] == "on":
                # wrap the callback
                callback = partial(
                    self.callback, msg=msg, post_callback=post_callback)
                if callback_id:
                    self._callback_cache.add_callback({
                        "client_id": client_id,
                        "callback_id": callback_id,
                        "callback": callback,
                        "name": msg.get("name", None)
                    })
            elif callback_id is not None:
                # remove the callback with `callback_id`
                self._callback_cache.remove_callbacks(
                    lambda cb: cb["callback_id"] != callback_id)
            if callback is not None:
                # call the underlying method on the Table or View, and apply
                # the dictionary of kwargs that is passed through.
                if (method == "on_update"):
                    # If there are no arguments, make sure we call `on_update`
                    # with mode set to "none".
                    mode = {"mode": "none"}
                    if len(args) > 0:
                        mode = args[0]
                    getattr(table_or_view, method)(callback, **mode)
                else:
                    getattr(table_or_view, method)(callback)
            else:
                logging.info("callback not found for remote call {}".format(msg))
        except Exception as error:
            post_callback(json.dumps(self._make_error_message(msg["id"], error), cls=DateTimeEncoder))

    def _process_bytes(self, binary, msg, post_callback):
        """Send a bytestring message to the client without attempting to
        serialize as JSON.

        Perspective's client expects two messages to be sent when a binary
        payload is expected: the first message is a JSON-serialized string with
        the message's `id` and `msg`, and the second message is a bytestring
        without any additional metadata. Implementations of the `post_callback`
        should have an optional kwarg named `binary`, which specifies whether
        `data` is a bytestring or not.

        Args:
            binary (bytes, bytearray) : a byte message to be passed to the client.
            msg (dict) : the original message that generated the binary
                response from Perspective.
            post_callback (callable) : a function that passes data to the
                client, with a `binary` (bool) kwarg that allows it to pass
                byte messages without serializing to JSON.
        """
        pre_msg = self._make_message(msg["id"], "")
        pre_msg["is_transferable"] = True
        post_callback(json.dumps(pre_msg, cls=DateTimeEncoder))
        post_callback(binary, binary=True)

    def callback(self, *args, **kwargs):
        '''Return a message to the client using the `post_callback` method.'''
        id = kwargs.get("msg")["id"]
        data = kwargs.get("event", None)
        post_callback = kwargs.get("post_callback")
        msg = self._make_message(id, data)
        if len(args) > 0 and type(args[0]) == bytes:
            self._process_bytes(args[0], msg, post_callback)
        else:
            post_callback(json.dumps(msg, cls=DateTimeEncoder))

    def clear_views(self, client_id):
        '''Garbage collect views that belong to closed connections.'''
        count = 0
        names = []

        if not client_id:
            raise PerspectiveError("Cannot garbage collect views that are not linked to a specific client ID!")

        for name, view in self._views.items():
            if view._client_id == client_id:
                view.delete()
                names.append(name)
                count += 1

        for name in names:
            self._views.pop(name)

        logging.warning("GC {} views in memory".format(count))

    def _make_message(self, id, result):
        '''Return a serializable message for a successful result.'''
        return {
            "id": id,
            "data": result
        }

    def _make_error_message(self, id, error):
        '''Return a serializable message for an error result.'''
        return {
            "id": id,
            "error": error
        }

    def _is_locked_command(self, msg):
        '''Returns `True` if the manager instance is locked and the command
        is in `PerspectiveManager.LOCKED_COMMANDS`, and `False` otherwise.'''
        if not self._lock:
            return False

        cmd = msg["cmd"]
        method = msg.get("method", None)

        if cmd == "table_method" and method == "delete":
            # table.delete is blocked, but view.delete is not
            return True

        return cmd == "table" or method in PerspectiveManager.LOCKED_COMMANDS
