# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import sys
from .base import PerspectiveBaseMixin


class PerspectiveHTTPMixin(object):
    def loadData(self, transfer_as_arrow=False, **kwargs):
        # Override
        kwargs['transfer_as_arrow'] = transfer_as_arrow

        self.psp = PerspectiveBaseMixin()
        self.psp.setup(**kwargs)

    def getData(self, data_only=False):
        if self.psp.datasrc in ('arrow',):
            # TODO think of alternative
            if 'tornado' in sys.modules:
                import tornado.web
                if isinstance(self, tornado.web.RequestHandler):
                    if self.get_argument('_fetch_arrow', ''):
                        return self.psp._as_json(data_only=True)
        return self.psp._as_json(data_only=data_only, allow_nan=False)


class PerspectiveWSMixin(object):
    def loadData(self, **kwargs):
        self.psp = PerspectiveBaseMixin()
        self.psp.setup(**kwargs)

    def stream_open(self):
        print("opened")

    def stream_message(self, message):
        self.write_message(u"You said: " + message)

    def streams_close(self):
        print("Closed")

    def getData(self, data_only=False):
        return self.psp._as_json(data_only=data_only, allow_nan=False)
