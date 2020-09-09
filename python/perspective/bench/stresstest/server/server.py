################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
import argparse
import os
import random
import tornado
import perspective

from manager_telemetry import PerspectiveManagerWithTelemetry
from tornado_handler_telemetry import PerspectiveTornadoHandlerWithTelemetry

PARSER = argparse.ArgumentParser(
    description="A perspective-python server configured to provide telemetry for use with stress testing."
)

PARSER.add_argument(
    "--table_size",
    dest="table_size",
    default=10000,
    type=int,
    help="The row size of the initial table. Defaults to 10000 rows.",
)

PARSER.add_argument(
    "--update_size",
    dest="update_size",
    type=int,
    default=50,
    help="The row size of each update. Defaults to 50 rows.",
)

PARSER.add_argument(
    "--update_rate",
    dest="update_rate",
    type=float,
    default=500,
    help="The frequency of each update in milliseconds. Defaults to 500 milliseconds.",
)

PARSER.add_argument(
    "--port",
    dest="port",
    type=float,
    default=8888,
    help="A port to host the Tornado server on. Defaults to 8888.",
)


HERE = os.path.abspath(os.path.dirname(__file__))
TABLE = None
VIEW = None
MANAGER = PerspectiveManagerWithTelemetry()


with open(
    os.path.join(
        HERE,
        "..",
        "..",
        "..",
        "..",
        "..",
        "node_modules",
        "superstore-arrow",
        "superstore.arrow",
    ),
    "rb",
) as arrow:
    TABLE = perspective.Table(arrow.read(), index="Row ID")
    VIEW = TABLE.view()


def get_data(update_size):
    """Return `update_size` random rows from the dataset, with their Row IDs
    tweaked to be half appends and half partial updates."""
    size = TABLE.size()
    start = random.randint(0, size - update_size - 1)
    end = start + update_size
    data = VIEW.to_dict(start_row=start, end_row=end)

    # Generate some random row IDs
    data["Row ID"] = [
        random.randint(size, size + update_size) if i % 2 else data["Row ID"][i]
        for i in range(len(data["Row ID"]))
    ]

    # And other randomized values
    data["Sales"] = [
        random.randint(10, 1000) * random.random() for i in range(len(data["Sales"]))
    ]
    data["Profit"] = [
        random.randint(10, 100) * random.random() for i in range(len(data["Profit"]))
    ]

    return data


def make_app(table_size, update_size, update_rate):
    """Create a Tornado application for the webserver."""
    MANAGER.host_table("table", TABLE)
    MANAGER.host_view("view", VIEW)

    if table_size is not None and TABLE.size() < table_size:
        current_size = TABLE.size()

        while current_size < table_size:
            logging.warning(
                "Current table size %d, requested table size %d - inflating",
                TABLE.size(),
                table_size,
            )
            diff = table_size - TABLE.size()
            data = []

            # less than 2x table size
            if diff < TABLE.size():
                data = VIEW.to_dict(end_row=diff)
            else:
                data = VIEW.to_dict()

            data["Row ID"] = [i for i in range(TABLE.size() + 1, table_size)]
            TABLE.update(data)
            current_size = TABLE.size()

    logging.info("Table size: %d", TABLE.size())

    # Update the table with `update_size` rows every `update_rate` milliseconds
    def updater():
        TABLE.update(get_data(update_size))

    callback = tornado.ioloop.PeriodicCallback(
        callback=updater, callback_time=update_rate
    )
    callback.start()

    return tornado.web.Application(
        [
            (
                r"/",
                PerspectiveTornadoHandlerWithTelemetry,
                {"manager": MANAGER, "check_origin": True},
            )
        ]
    )


def start(port, table_size, update_size, update_rate):
    """Start the webserver at the given port."""
    app = make_app(table_size, update_size, update_rate)
    app.listen(port)
    logging.critical("Listening on http://localhost:{}".format(port))
    loop = tornado.ioloop.IOLoop.current()
    loop.start()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    args = PARSER.parse_args()
    logging.info(
        "Running server on port %d - Hosting Table of size %d, updating with %d rows every %2f milliseconds",
        args.port,
        args.table_size,
        args.update_size,
        args.update_rate,
    )
    start(args.port, args.table_size, args.update_size, args.update_rate)
