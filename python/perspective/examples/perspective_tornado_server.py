import os
import os.path
import sys
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
import pandas as pd

sys.path.insert(1, os.path.join(os.path.dirname(__file__), '..'))
from perspective import PerspectiveViewer, PerspectiveTornadoHandler


class MainHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def get(self):
        self.render("perspective_tornado_client.html")


def make_app():
    '''Create and return a Tornado app.

    For `PerspectiveTornadoHandler` to work, it must be passed an instance of `PerspectiveViewer`.

    Inside this function, we create a PerspectiveViewer and load data into it using its `load` method.

    By passing a name into `load`, we guarantee the existence of a table with the name "data_source_one". This allows us to reference the Table
    from the front-end with its known name. Without the `name` kwarg, the front-end has no way of knowing how to look up the Table on the backend.
    '''
    VIEWER = PerspectiveViewer()
    VIEWER.load(pd.read_csv("superstore.csv"), name="data_source_one")
    return tornado.web.Application([
        (r"/", MainHandler),
        # create a websocket endpoint that the client Javascript can access
        (r"/websocket", PerspectiveTornadoHandler, {"viewer": VIEWER, "check_origin": True})
    ])


if __name__ == "__main__":
    # Because we use `PerspectiveTornadoHandler`, all that needs to be done in `init` is to start the Tornado server.
    app = make_app()
    app.listen(8888)
    logging.critical("Listening on http://localhost:8888")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
