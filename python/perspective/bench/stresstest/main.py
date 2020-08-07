################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import asyncio
import concurrent.futures
import logging
import tornado
import threading

from tornado.platform.asyncio import AnyThreadEventLoopPolicy
from client import PerspectiveWebSocketClient


def get_free_port():
    sockets = tornado.netutil.bind_sockets(0, '127.0.0.1')
    return sockets[0].getsockname()[:2][1]


@tornado.gen.coroutine
def run():
    """Create a new client and run it forever on a new IOLoop."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    client = PerspectiveWebSocketClient("ws://127.0.0.1:{}/".format(8888))
    loop.run_until_complete(client.run_until_timeout())
    loop.run_forever()


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    tornado.platform.asyncio.asyncio.set_event_loop_policy(AnyThreadEventLoopPolicy())

    # as num_clients increases, how does performance drop off?
    for i in range(3):
        t = threading.Thread(target=run)
        logging.info("Init client %s", i)
        t.start()
