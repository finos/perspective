# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import json
import tornado.websocket
from datetime import datetime
from .exception import PerspectiveError


class DateTimeEncoder(json.JSONEncoder):
    '''Create a custom JSON encoder that allows serialization of datetime and date objects.'''

    def default(self, obj):
        if isinstance(obj, datetime):
            # Convert to milliseconds - perspective.js expects millisecond timestamps, but python generates them in seconds.
            return obj.timestamp() * 1000
        return super(DateTimeEncoder, self).default(obj)


# keep track of each client connection
CLIENT_ID = 0


class PerspectiveTornadoHandler(tornado.websocket.WebSocketHandler):
    '''PerspectiveTornadoHandler is a drop-in implementation of Perspective.

    Use it inside Tornado routing to create a server-side Perspective that is ready to receive websocket messages from
    the front-end `perspective-viewer`.

    Examples:
        >>> VIEWER = PerspectiveViewer()
        >>> VIEWER.load(pd.read_csv("superstore.csv"), name="data_source_one")
        >>> app = tornado.web.Application([
                (r"/", MainHandler),
                (r"/websocket", PerspectiveTornadoHandler, {"viewer": VIEWER, "check_origin": True})
            ])
    '''

    def __init__(self, *args, **kwargs):
        '''Create a new instance of the PerspectiveTornadoHandler with the given Viewer instance.

        Args:
            **kwargs (dict) : keyword arguments for the Tornado handler.
                - viewer (PerspectiveViewer) : a `PerspectiveViewer` instance. Must be provided on initialization.
                - check_origin (bool) : if True, all requests will be accepted regardless of origin. Defaults to False.
        '''
        global CLIENT_ID
        CLIENT_ID += 1
        self.CLIENT_ID = CLIENT_ID
        self._viewer = kwargs.pop("viewer", None)
        self._check_origin = kwargs.pop("check_origin", False)

        if self._viewer is None:
            raise PerspectiveError("A `PerspectiveViewer` instance must be provided to the tornado handler!")

        super(PerspectiveTornadoHandler, self).__init__(*args, **kwargs)

    def check_origin(self, origin):
        '''Returns whether the handler allows requests from origins outside of the host URL.'''
        return self._check_origin

    def on_message(self, message):
        '''When the websocket receives a message, send it to the `process` method of the `PerspectiveManager` with a reference to the `post` callback.'''
        if message == "heartbeat":
            return
        message = json.loads(message)
        self._viewer.manager.process(message, self.post, client_id=self.CLIENT_ID)

    def post(self, message):
        '''When `post` is called by `PerspectiveManager`, serialize the data to JSON and send it to the client.'''
        message = json.dumps(message, cls=DateTimeEncoder)
        self.write_message(message)

    def on_close(self):
        '''Remove the views associated with the client when the websocket closes.'''
        self._viewer.manager.clear_views(self.CLIENT_ID)
