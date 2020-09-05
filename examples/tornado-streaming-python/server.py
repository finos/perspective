import random
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
from datetime import date, datetime
from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler


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
        # create a websocket endpoint that the client Javascript can access
        (r"/websocket", PerspectiveTornadoHandler, {
            "manager": MANAGER,
            "check_origin": True
        }),
        (r"/node_modules/(.*)", tornado.web.StaticFileHandler, {
            "path": "../../node_modules/@finos/"
        }),
        (r"/(.*)", tornado.web.StaticFileHandler, {
            "path": "./",
            "default_filename": "index.html"
        })
    ])


if __name__ == "__main__":
    app = make_app()
    app.listen(8080)
    logging.critical("Listening on http://localhost:8080")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
