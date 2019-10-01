# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
from functools import partial
from .table import Table
from ..core.exception import PerspectiveError


class PerspectiveManager(object):
    def __init__(self):
        self._tables = {}
        self._views = {}
        self._callback_cache = {}

    def host_table(self, name, table):
        '''Given a reference to a `Table`, manage it and allow operations on it to occur through the Manager.'''
        self._tables[name] = table

    def process(self, msg, post_callback):
        '''Given a message from the client, process it through the Perspective engine.

        Params:
            msg (dict) : a message from the client with instructions that map to engine operations
            post_callback (callable) : a function that returns data to the client
        '''
        if not isinstance(msg, dict):
            raise PerspectiveError("Message passed into `process()` should be a dict, i.e. JSON strings should have been deserialized using `json.loads()`.")

        cmd = msg["cmd"]

        if cmd == "init":
            # return empty response
            post_callback(self._make_message(msg["id"], None))
        elif cmd == "table":
            try:
                # create a new Table and track it
                data_or_schema = msg["args"][0]
                self._tables[msg["name"]] = Table(data_or_schema, **msg.get("options", {}))
            except IndexError:
                self._tables[msg["name"]] = []
        elif cmd == "view":
            # create a new view and track it
            new_view = self._tables[msg["table_name"]].view(**msg.get("config", {}))
            self._views[msg["view_name"]] = new_view
        elif cmd == "table_method" or cmd == "view_method":
            self._process_method_call(msg, post_callback)

    def _process_method_call(self, msg, post_callback):
        '''When the client calls a method, validate the instance it calls on and return the result.'''
        if msg["cmd"] == "table_method":
            table_or_view = self._tables.get(msg["name"], None)
        else:
            table_or_view = self._views.get(msg["name"], None)
            if table_or_view is None:
                post_callback(self._make_error_message(msg["id"], "View is not initialized"))
        try:
            if msg.get("subscribe", False) is True:
                self._process_subscribe(msg, table_or_view, post_callback)
            else:
                args = {}
                if msg["method"] == "schema":
                    args["as_string"] = True  # make sure schema returns string types
                elif msg["method"].startswith("to_"):
                    # TODO
                    for d in msg.get("args", []):
                        args.update(d)
                else:
                    args = msg.get("args", [])

                if msg["method"] == "delete" and msg["cmd"] == "view_method":
                    # views can be removed, but tables cannot
                    self._views.pop(msg["name"], None)
                    return

                if msg["method"].startswith("to_"):
                    # to_format takes dictionary of options
                    result = getattr(table_or_view, msg["method"])(**args)
                elif msg["method"] != "delete":
                    # otherwise parse args as list
                    result = getattr(table_or_view, msg["method"])(*args)
                # return the result to the client
                post_callback(self._make_message(msg["id"], result))
        except Exception as error:
            logging.error(self._make_error_message(msg["id"], error))

    def _process_subscribe(self, msg, table_or_view, post_callback):
        '''When the client attempts to add or remove a subscription callback, validate and perform the requested operation.

        Params:
            msg (dict) : the message from the client
            table_or_view {Table|View} : the instance that the subscription will be called on
            post_callback (callable) : a method that notifies the client with new data
        '''
        try:
            callback = None
            callback_id = msg.get("callback_id", None)
            method = msg.get("method", None)
            if method and method[:2] == "on":
                # wrap the callback
                callback = partial(PerspectiveManager.callback, msg=msg, post_callback=post_callback, self=self)
                if callback_id:
                    self._callback_cache[callback_id] = callback
            elif callback_id is not None:
                # remove the callback with `callback_id`
                self._callback_cache.pop(callback_id, None)
            if callback is not None:
                # call the underlying method on the Table or View
                getattr(table_or_view, method)(callback, *msg.get("args", []))
            else:
                logging.info("callback not found for remote call {}".format(msg))
        except Exception as error:
            logging.error(self._make_error_message(msg["id"], error))

    def callback(self, **kwargs):
        '''Return a message to the client using the `post_callback` method.'''
        id = kwargs.get("msg")["id"]
        data = kwargs.get("event", None)
        post_callback = kwargs.get("post_callback")
        post_callback(self._make_message(id, data))

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
