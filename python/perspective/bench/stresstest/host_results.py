################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
import argparse
import logging
import tornado.websocket
import tornado.web
import tornado.ioloop
import perspective
from pathlib import Path

HERE = os.path.abspath(os.path.dirname(__file__))
CLIENT_PATH = os.path.join(HERE, "client.py")

PARSER = argparse.ArgumentParser(
    description="Host results from a stresstest run in a Perspective Table."
)

PARSER.add_argument(
    "--export",
    default=True,
    type=bool,
    help="Whether to export the accumulated results as a single Arrow. Defaults to True.",
)

PARSER.add_argument(
    "--latest",
    dest="latest",
    default=False,
    type=bool,
    help="Whether to find the newest folder of results, or use the exact results path.",
)

PARSER.add_argument(
    "results_path",
    help="A path to a folder containing test results stored as Arrows. If --latest is True, the script will find the newest created folder of results.",
)

MANAGER = perspective.PerspectiveManager()


class MainHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")

    def get(self):
        self.render("results.html")


def make_results_table(results_path):
    """Given a path to a folder containing Arrow files, create a Perspective
    Table from the first arrow and update with the rest. This allows us to
    coalesce results from individual subprocesses into one single Table."""
    assert os.path.exists(results_path)

    table = None
    for file in os.listdir(results_path):
        path = Path(file)
        valid = path.suffix == ".arrow" and path.name != "results_combined.arrow"
        if valid:
            with open(os.path.join(results_path, file), "rb") as arrow:
                if table is not None:
                    table.update(arrow.read())
                    logging.info("Updated results table with %s", file)
                else:
                    table = perspective.Table(arrow.read())
                    logging.info("Created results table with %s", file)

    logging.info("Final results table size: %d", table.size())
    return table


def make_app(results_path):
    TABLE = make_results_table(results_path)

    MANAGER.host_table("results_table", TABLE)
    MANAGER.host_view("results_view", TABLE.view())

    return tornado.web.Application(
        [
            (r"/", MainHandler),
            # create a websocket endpoint that the client Javascript can access
            (
                r"/websocket",
                perspective.PerspectiveTornadoHandler,
                {"manager": MANAGER, "check_origin": True},
            ),
        ]
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    args = PARSER.parse_args()
    RESULTS_PATH = args.results_path
    EXPORT = args.export

    if args.latest:
        dirs = []
        paths = sorted(
            [p for p in Path(RESULTS_PATH).iterdir() if p.is_dir()],
            key=os.path.getmtime,
        )
        RESULTS_PATH = paths[-1]
        logging.info("Results path: %s", RESULTS_PATH)

    app = make_app(RESULTS_PATH)

    if EXPORT:
        view = MANAGER.get_view("results_view")
        filename = "results_combined.arrow".format(RESULTS_PATH)
        path = os.path.join(RESULTS_PATH, filename)
        with open(path, "wb") as arrow:
            arrow.write(view.to_arrow())
        logging.info("Exported combined arrow to: %s", path)

    app.listen(8889)
    logging.critical("Listening on http://localhost:8889")
    loop = tornado.ioloop.IOLoop.current()
    loop.start()
