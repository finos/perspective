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
import signal
import tornado
from timeit import timeit
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '..'))
from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler  # noqa: E402

logging.basicConfig(level=logging.INFO)


class BenchmarkTornadoHandler(tornado.web.RequestHandler):
    """Host the results of the benchmark suite over a websocket."""

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def get(self):
        self.render("benchmark.html")


class Benchmark(object):
    """A single Benchmark function. Use as a wrapper for stateless lambdas
    with no parameters.

    Example:
        >>> func = Benchmark(lambda: self._view.to_records(), meta={
                "name": "to_records",
                "group": "view"
            })
    """

    def __init__(self, func, meta={}):
        """A decorator for a benchmark function, which will attach each attribute
        of the `meta` dictionary to the decorated function as well as provide
        it with the `benchmark` attribute.

        Args:
            meta (dict) : a metadata dictionary, whose keys and values will
                become attributes on the benchmark function. The metadata dictionary
                should be consistent within each suite, i.e. there should be no
                additional values in between different methods decorated with
                `@benchmark`.
        """
        self._func = func
        self._meta = meta
        self.benchmark = True

        for k, v in self._meta.items():
            marked_key = "__BENCH__{0}".format(k)
            setattr(self, marked_key, v)

    def __call__(self):
        """Call the lambda bound to the decorator. This call asserts that the
        lambda has no parameters and no reference to a `self` object.
        """
        self._func()


class Suite(object):
    """A benchmark suite stub that contains `register_benchmarks` and generic
    before/after methods.

    Inherit from this class and implement `register_benchmarks`, which should
    set all benchmark methods as attributes on the class.
    """

    def register_benchmarks(self):
        """Registers all callbacks with `Runner`.

        This function must be implemented in all child classes of `Suite.`
        """
        raise NotImplementedError(
                "Must implement `register_benchmarks` to run benchmark suite.")

    def before_all(self):
        pass

    def after_all(self):
        pass

    def before_each(self):
        pass

    def after_each(self):
        pass


class Runner(object):

    ITERATIONS = 10

    def __init__(self, suite):
        """Initializes a benchmark runner for the `Suite`.

        Args:
            suite (Suite) : A class that inherits from `Suite`, with any number
                of instance methods decorated with `@benchmark`.
        """
        self._suite = suite
        self._benchmarks = []
        self._table = None
        self._WROTE_RESULTS = False
        self._HOSTING = False

        self._suite.register_benchmarks()

        class_attrs = self._suite.__class__.__dict__.items()
        instance_attrs = self._suite.__dict__.items()

        for (k, v) in class_attrs:
            if hasattr(v, "benchmark") and getattr(v, "benchmark") is True:
                logging.info("Registering {0}".format(k))
                self._benchmarks.append(v)

        for (k, v) in instance_attrs:
            if hasattr(v, "benchmark") and getattr(v, "benchmark") is True:
                logging.info("Registering {0}".format(k))
                self._benchmarks.append(v)

        # Write results on SIGINT
        signal.signal(signal.SIGINT, self.sigint_handler)

    def sigint_handler(self, signum, frame):
        """On SIGINT, host the results over a websocket."""
        if not self._WROTE_RESULTS:
            self.write_results()
        if not self._HOSTING:
            self.host_results()
        else:
            sys.exit(0)

    def host_results(self):
        """Create a tornado application that hosts the results table over a
        websocket."""
        if self._table is None:
            return
        MANAGER = PerspectiveManager()
        MANAGER.host_table("benchmark_results", self._table)
        application = tornado.web.Application([
            (r"/", BenchmarkTornadoHandler),
            # create a websocket endpoint that the client Javascript can access
            (r"/websocket", PerspectiveTornadoHandler, {
                "manager": MANAGER,
                "check_origin": True
            })
        ])
        self._HOSTING = True
        application.listen(8888)
        logging.critical("Displaying results at http://localhost:8888")
        loop = tornado.ioloop.IOLoop.current()
        loop.start()

    def write_results(self):
        if self._table is None:
            return
        logging.info("Writing results to `benchmark.arrow`")
        arrow_path = os.path.join(os.path.dirname(__file__), "benchmark.arrow")
        with open(arrow_path, "wb") as file:
            arrow = self._table.view().to_arrow()
            file.write(arrow)
        self._WROTE_RESULTS = True

    def run_method(self, func, *args, **kwargs):
        """Wrap the benchmark `func` with timing code and run for n
        `ITERATIONS`, returning a result row that can be fed into Perspective.
        """
        overall_result = {
            k.replace("__BENCH__", ""):
                v for (k, v) in func.__dict__.items() if "__BENCH__" in k
        }

        result = timeit(func, number=Runner.ITERATIONS) / Runner.ITERATIONS
        overall_result["__TIME__"] = result
        return overall_result

    def run(self):
        """Runs each benchmark function from the suite for n `ITERATIONS`,
        timing each function and writing the results to a `perspective.Table`.
        """
        logging.info("Running benchmark suite...")
        for benchmark in self._benchmarks:
            result = self.run_method(benchmark)
            print(result)
            if self._table is None:
                self._table = Table([result])
            else:
                self._table.update([result])
        self.write_results()
        self.host_results()
