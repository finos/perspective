#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import random
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
from datetime import date, datetime
import perspective
import json

old = json.JSONEncoder.default


def new_encoder(self, obj):
    if isinstance(obj, datetime):
        return str(obj)
    elif isinstance(obj, date):
        return str(obj)
    else:
        return old(self, obj)


json.JSONEncoder.default = new_encoder


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


def perspective_thread(perspective_server):
    client = perspective_server.new_client()
    table = client.table(
        {
            "name": "string",
            "client": "string",
            "open": "float",
            "high": "float",
            "low": "float",
            "close": "float",
            "lastUpdate": "datetime",
            "date": "date",
        },
        limit=2500,
        name="data_source_one",
    )

    # update with new data every 50ms
    def updater():
        table.update(data_source())

    callback = tornado.ioloop.PeriodicCallback(callback=updater, callback_time=50)
    callback.start()


def make_app(perspective_server):
    return tornado.web.Application(
        [
            (
                r"/websocket",
                perspective.PerspectiveTornadoHandler,
                {"perspective_server": perspective_server},
            ),
            (
                r"/node_modules/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "../../node_modules/"},
            ),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "./", "default_filename": "index.html"},
            ),
        ]
    )


if __name__ == "__main__":
    perspective_server = perspective.Server()

    app = make_app(perspective_server)
    app.listen(8080)
    logging.critical("Listening on http://localhost:8080")
    loop = tornado.ioloop.IOLoop.current()
    loop.call_later(0, perspective_thread, perspective_server)
    loop.start()
