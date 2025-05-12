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
import perspective.handlers.tornado
import threading
import time
from functools import partial
from concurrent.futures import ThreadPoolExecutor


def data_source(num_rows):
    rows = []
    modifier = random.random() * random.randint(1, 50)
    for i in range(num_rows):
        rows.append(
            {
                "name": SECURITIES[random.randint(0, len(SECURITIES) - 1)],
                "client": CLIENTS[random.randint(0, len(CLIENTS) - 1)],
                "open": (random.random() * 75 + random.randint(0, 9)) * modifier,
                "high": (random.random() * 105 + random.randint(1, 3)) * modifier,
                "low": (random.random() * 85 + random.randint(1, 3)) * modifier,
                "close": (random.random() * 90 + random.randint(1, 3)) * modifier,
                "lastUpdate": datetime.now().timestamp() * 1000,
                "date": date.today().strftime("%Y-%m-%d"),
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


def update_target(perspective_server):
    client = perspective_server.new_local_client()
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
        limit=250_000,
        name="data_source_one",
    )

    while True:
        table.update(data_source(num_rows=50))
        time.sleep(0.01)


def poll_target(lock, perspective_server):
    try:
        perspective_server.poll()
    finally:
        lock.release()


def on_poll_request(lock, executor, perspective_server):
    if lock.acquire(blocking=False):
        executor.submit(poll_target, lock, perspective_server)


def make_app(executor, perspective_server):
    return tornado.web.Application(
        [
            (
                r"/websocket",
                perspective.handlers.tornado.PerspectiveTornadoHandler,
                {"perspective_server": perspective_server, "executor": executor},
            ),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {"path": "./", "default_filename": "index.html"},
            ),
        ]
    )


if __name__ == "__main__":
    executor = ThreadPoolExecutor()
    lock = threading.Lock()
    perspective_server = perspective.Server(
        on_poll_request=partial(on_poll_request, lock, executor),
    )

    thread = threading.Thread(target=update_target, args=(perspective_server,))
    thread.start()

    loop = tornado.ioloop.IOLoop.current()
    app = make_app(executor, perspective_server)
    app.listen(8080)
    logging.warning("Listening on http://localhost:8080")
    loop.start()
