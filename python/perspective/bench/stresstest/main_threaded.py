################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import asyncio
import logging
import os
import signal
import sys
import tornado
import threading
import perspective

from datetime import datetime
from tornado.platform.asyncio import AnyThreadEventLoopPolicy
from client import PerspectiveWebSocketClient
from results_schema import RESULTS_SCHEMA

HERE = os.path.abspath(os.path.dirname(__file__))

RESULTS_TABLE = perspective.Table(RESULTS_SCHEMA)


def dump_and_exit(sig, frame):
    filename = "results_{:%Y%m%dT%H%M%S}.arrow".format(datetime.now())
    logging.critical("KeyboardInterrupt: dumping %s rows of results to %s", RESULTS_TABLE.size(), filename)

    with open(os.path.join(HERE, filename), "wb") as results_arrow:
        results_arrow.write(RESULTS_TABLE.view().to_arrow())

    logging.critical("Exiting")
    sys.exit(0)


def get_free_port():
    sockets = tornado.netutil.bind_sockets(0, '127.0.0.1')
    return sockets[0].getsockname()[:2][1]


def run(client_id):
    """Create a new client and run it forever on a new IOLoop."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    client = PerspectiveWebSocketClient("ws://127.0.0.1:{}/".format(8888), client_id, RESULTS_TABLE)
    loop.run_until_complete(client.run_until_timeout())
    loop.run_forever()


if __name__ == "__main__":
    signal.signal(signal.SIGINT, dump_and_exit)
    logging.basicConfig(level=logging.DEBUG)
    tornado.platform.asyncio.asyncio.set_event_loop_policy(AnyThreadEventLoopPolicy())
    run("client_0")
    # as num_clients increases, how does performance drop off?
    for i in range(6):
        t = threading.Thread(target=run, args=["client_{}".format(i)])
        logging.info("Init client %s", i)
        t.start()
