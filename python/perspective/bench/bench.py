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
from time import perf_counter
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '..'))
from perspective import Table  # noqa: E402

logging.basicConfig(level=logging.INFO)


class Benchmark(object):
    """A single Benchmark function. Use as a decorator for stateless lambdas
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
        """On SIGINT, write benchmark results to Arrow and exit gracefully."""
        self.write_results()
        sys.exit(0)

    def write_results(self):
        """Writes the results to an arrow file."""
        if not self._table:
            logging.info("No results to write, exiting.")
            return
        logging.info("Writing results to Arrow...")

    def run_method(self, func, *args, **kwargs):
        """Wrap the benchmark `func` with timing code and run for n
        `ITERATIONS`, returning a result row that can be fed into Perspective.
        """
        overall_result = {
            k.replace("__BENCH__", ""):
                v for (k, v) in func.__dict__.items() if "__BENCH__" in k
        }

        iter_results = []
        for i in range(Runner.ITERATIONS):
            start = perf_counter()
            func(*args, **kwargs)
            end = perf_counter()
            iter_results.append(end - start)

        overall_result["__TIME__"] = sum(iter_results) / len(iter_results)
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
