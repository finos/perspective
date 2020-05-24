import os
import os.path
import random
import sys
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
from datetime import date, datetime

sys.path.insert(1, os.path.join(os.path.dirname(__file__), '..'))
from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler


class MainHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def get(self):
        self.render("streaming.html")


def data_source():
    rows = []
    modifier = random.random() * random.randint(1, 50)
    for i in range(5):
        rows.append({
            "name": SECURITIES[random.randint(0, len(SECURITIES) - 1)],
            "client": CLIENTS[random.randint(0, len(CLIENTS) - 1)],
            "open": (random.random() * 75 + random.randint(0, 9)) * modifier,
            "high": (random.random() * 105 + random.randint(1, 3)) * modifier,
            "low": (random.random() * 85 + random.randint(1, 3)) * modifier,
            "close": (random.random() * 90 + random.randint(1, 3)) * modifier,
            "lastUpdate": datetime.now(),
            "date": date.today()
        })
    return rows


'''Set up our data for this example.'''
SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"]
CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"]


def make_app():
    # Create an instance of `PerspectiveManager` and a table.
    MANAGER = PerspectiveManager()
    TABLE = Table({
        "name": str,
        "client": str,
        "open": float,
        "high": float,
        "low": float,
        "close": float,
        "lastUpdate": datetime,
        "date": date
    }, limit=2500)

    # Track the table with the name "data_source_one", which will be used in
    # the front-end to access the Table.
    MANAGER.host_table("data_source_one", TABLE)

    # update with new data every 50ms
    def updater():
        TABLE.update(data_source())

    callback = tornado.ioloop.PeriodicCallback(callback=updater, callback_time=50)
    callback.start()

    return tornado.web.Application([
        (r"/", MainHandler),
        # create a websocket endpoint that the client Javascript can access
        (r"/websocket", PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
    ])


if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    logging.critical("Listening on http://localhost:8888")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
