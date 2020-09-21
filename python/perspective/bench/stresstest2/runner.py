################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import logging
import re
import sys
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


def read_args():
    """Read args from argv for quick and dirty GCC-style arguments."""
    num_clients = 10
    num_runs = 1
    sleep_time = 0

    for arg in sys.argv[1:]:
        flag = arg[:2].lower()
        value = re.search(r"\d+", arg)
        if value:
            match = value.group(0)
            if flag == "-c":
                num_clients = int(match)
            elif flag == "-r":
                num_runs = int(match)
            elif flag == "-s":
                sleep_time = float(match)

    return num_clients, num_runs, sleep_time


class PerspectiveBenchRunner(object):
    def __init__(self, task):
        """A simple test runner for a perspective-python benchmark. See
        `scenarios/gil_test.py` for example usage."""
        self.task = task
        self.url = sys.argv.pop()
        self.num_clients, self.num_runs, self.sleep_time = read_args()

        logging.critical(
            "Running task %d times over %d clients against %s",
            self.num_runs,
            self.num_clients,
            self.url,
        )

    def run(self):
        client = partial(self.run_client, self)
        with multiprocessing.Pool(processes=self.num_clients) as pool:
            samples = pool.map(client, range(self.num_clients))
            least_sq(numpy.array(samples).flatten())

    def run_client(self, *args):
        i = args[-1]
        return asyncio.run(self.client(i))

    async def client(self, client_id):
        psp_client = await perspective.tornado_handler.websocket(self.url)
        results = []
        for i in range(self.num_runs):
            logging.info("Client {}, Run {}".format(client_id, i))
            result = await self.task(psp_client)
            results.append(result)
            if self.sleep_time > 0:
                await asyncio.sleep(self.sleep_time)
        return numpy.array(results).flatten()
