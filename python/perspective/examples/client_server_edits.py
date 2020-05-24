import os
import os.path
import random
import sys
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
import pandas as pd
from datetime import datetime

sys.path.insert(1, os.path.join(os.path.dirname(__file__), '..'))
from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler


class MainHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def get(self):
        self.render("client_server_edits.html")


here = os.path.abspath(os.path.dirname(__file__))


def make_app():
    # Create an instance of `PerspectiveManager` and a table.
    MANAGER = PerspectiveManager()
    TABLE = None

    TABLE = Table(pd.read_csv(os.path.join(here, "superstore.csv")), index="Row ID")

    # Track the table with the name "data_source_one", which will be used in
    # the front-end to access the Table.
    MANAGER.host_table("data_source_one", TABLE)
    MANAGER.host_view("view_one", TABLE.view())

    return tornado.web.Application([
        (r"/", MainHandler),
        # create a websocket endpoint that the client Javascript can access
        (r"/websocket", PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
    ], websocket_ping_interval=15)


if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    logging.critical("Listening on http://localhost:8888")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
