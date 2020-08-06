################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
import os
import sys
import random
import tornado


sys.path.insert(1, os.path.join(os.path.dirname(__file__), "..", ".."))
import perspective


HERE = os.path.abspath(os.path.dirname(__file__))
TABLE = None
VIEW = None
MANAGER = perspective.PerspectiveManager()

with open(os.path.join(HERE, "superstore.arrow"), "rb") as arrow:
    TABLE = perspective.Table(arrow.read(), index="Row ID")
    VIEW = TABLE.view()


def get_data():
    """Return 50 random rows from the dataset, with their Row IDs tweaked to
    be half appends and half partial updates."""
    size = TABLE.size()
    start = random.randint(0, size - 51)
    end = start + 50
    data = VIEW.to_dict(start_row=start, end_row=end)

    # Generate some random row IDs
    data["Row ID"] = [random.randint(size, size + 50) if i % 2 else data["Row ID"][i] for i in range(len(data["Row ID"]))]

    # And other randomized values
    data["Sales"] = [random.randint(10, 1000) * random.random() for i in range(len(data["Sales"]))]
    data["Profit"] = [random.randint(10, 100) * random.random() for i in range(len(data["Profit"]))]

    return data


def make_app():
    """Create a Tornado application for the webserver."""
    MANAGER.host_table("table", TABLE)
    MANAGER.host_view("view", TABLE.view())

    # Update with 50 rows every second
    def updater():
        TABLE.update(get_data())

    callback = tornado.ioloop.PeriodicCallback(callback=updater, callback_time=1)
    callback.start()

    return tornado.web.Application([
        (r"/", perspective.PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
    ])


def start(port):
    """Start the webserver at the given port."""
    app = make_app()
    app.listen(port)
    logging.critical("Listening on http://localhost:{}".format(port))
    loop = tornado.ioloop.IOLoop.current()
    loop.start()


if __name__ == "__main__":
    start(8888)
