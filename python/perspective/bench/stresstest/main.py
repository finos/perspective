################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
import tornado
from client import PerspectiveWebSocketClient


def get_free_port():
    sockets = tornado.netutil.bind_sockets(0, '127.0.0.1')
    return sockets[0].getsockname()[:2][1]


@tornado.gen.coroutine
def run():
    client = PerspectiveWebSocketClient("ws://127.0.0.1:{}/".format(8888))
    yield client.run_until_timeout(timeout=5)


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    loop = tornado.ioloop.IOLoop.current()
    loop.add_callback(run)
    loop.start()
