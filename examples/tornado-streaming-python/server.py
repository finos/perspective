import random
import logging
import threading
import tornado.websocket
import tornado.web
import tornado.ioloop
from datetime import date, datetime
from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler


def data_source():
    rows = []
    modifier = random.random() * random.randint(1, 50)
    for i in range(5):
        rows.append(
            {
                "name": SECURITIES[random.randint(0, len(SECURITIES) - 1)],
                "client": CLIENTS[random.randint(0, len(CLIENTS) - 1)],
                "open": (random.random() * 75 + random.randint(0, 9)) * modifier,
                "high": (random.random() * 105 + random.randint(1, 3)) * modifier,
                "low": (random.random() * 85 + random.randint(1, 3)) * modifier,
                "close": (random.random() * 90 + random.randint(1, 3)) * modifier,
                "lastUpdate": datetime.now(),
                "date": date.today(),
            }
        )
    return rows


SECURITIES = [
    "AAPL.N",
    "AMZN.N",
    "QQQ.N",
    "NVDA.N",
    "TSLA.N",
    "FB.N",
    "MSFT.N",
    "TLT.N",
    "XIV.N",
    "YY.N",
    "CSCO.N",
    "GOOGL.N",
    "PCLN.N",
]

CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"]


def perspective_thread(manager):
    """Perspective application thread starts its own tornado IOLoop, and
    adds the table with the name "data_source_one", which will be used
    in the front-end."""
    psp_loop = tornado.ioloop.IOLoop()
    manager.set_loop_callback(psp_loop.add_callback)
    table = Table(
        {
            "name": str,
            "client": str,
            "open": float,
            "high": float,
            "low": float,
            "close": float,
            "lastUpdate": datetime,
            "date": date,
        },
        limit=2500,
    )

    # Track the table with the name "data_source_one", which will be used in
    # the front-end to access the Table.
    manager.host_table("data_source_one", table)

    # update with new data every 50ms
    def updater():
        table.update(data_source())

    callback = tornado.ioloop.PeriodicCallback(callback=updater, callback_time=50)
    callback.start()
    psp_loop.start()


def make_app():
    manager = PerspectiveManager()

    thread = threading.Thread(target=perspective_thread, args=(manager,))
    thread.daemon = True
    thread.start()

    return tornado.web.Application(
        [
            # create a websocket endpoint that the client Javascript can access
            (
                r"/websocket",
                PerspectiveTornadoHandler,
                {"manager": manager, "check_origin": True},
            ),
            (
                r"/node_modules/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "../../node_modules/@finos/"},
            ),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "./", "default_filename": "index.html"},
            ),
        ]
    )


if __name__ == "__main__":
    app = make_app()
    app.listen(8080)
    logging.critical("Listening on http://localhost:8080")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
