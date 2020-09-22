################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
import argparse
import pprint
import numpy
import multiprocessing
import asyncio
import perspective

from functools import partial

logging.basicConfig(
    format="%(asctime)s %(levelname)-8s %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S",
)


def least_sq(y):
    y = numpy.sort(y)
    n = len(y)
    x = numpy.arange(1, n + 1)
    x_mean = numpy.mean(x)
    y_mean = numpy.mean(y)
    numerator = 0
    denominator = 0
    for i in range(n):
        numerator += (x[i] - x_mean) * (y[i] - y_mean)
        denominator += (x[i] - x_mean) ** 2

    m = numerator / denominator
    b = y_mean - (m * x_mean)

    pprint.pprint(list(map(lambda x: round(x, 2), y)))
    print("Bias Coef {:.2f}".format(m))
    print("Intercept {:.2f}".format(b))
    print("Range {:.2f}".format(y[n - 1] - y[0]))
    print("Mean {:.2f}".format(numpy.mean(y)))


class PerspectiveTornadoBenchmark(object):
    def __init__(self, task):
        """A simple test runner for a perspective-python benchmark. See
        `scenarios/gil_test.py` for example usage."""
        self.task = task
        self.parser = argparse.ArgumentParser(
            description="Runs a task against a remote `perspective-python` server using multiple websocket clients."
        )

        self.parser.add_argument(
            "-c",
            "--clients",
            type=int,
            default=10,
            dest="num_clients",
            help="The number of clients that will be run against the remote server, each on a separate thread.",
        )
        self.parser.add_argument(
            "-r",
            "--runs",
            type=int,
            default=1,
            dest="num_runs",
            help="The number of times to run `task` on each client.",
        )
        self.parser.add_argument(
            "-s",
            "--sleep",
            type=float,
            default=0,
            dest="sleep_time",
            help="The number of seconds to sleep between each run of `task` on each client.",
        )

        self.parser.add_argument("url", type=str)
        self.parser.parse_args(namespace=self)

        logging.critical(
            "Running task %d times over %d clients against %s",
            self.num_runs,
            self.num_clients,
            self.url,
        )

        # Deref parser as it cannot be pickled for multiprocessing.
        self.parser = None

    def run(self):
        client = partial(self.run_client, self)
        with multiprocessing.Pool(processes=self.num_clients) as pool:
            samples = pool.map(client, range(self.num_clients))
            least_sq(numpy.array(samples).flatten())

    def run_client(self, *args):
        i = args[-1]
        return asyncio.run(self.client(i))

    async def client(self, client_id):
        """Create a Perspective websocket client and use it to run the task
        for `num_runs`."""
        psp_client = await perspective.tornado_handler.websocket(self.url)
        results = []
        for i in range(self.num_runs):
            result = await self.task(psp_client)
            logging.info("Client {}, Run {}, Result: {}".format(client_id, i, result))
            results.append(result)
            if self.sleep_time > 0:
                logging.info("Sleeping for {} seconds".format(self.sleep_time))
                await asyncio.sleep(self.sleep_time)
        return numpy.array(results).flatten()
