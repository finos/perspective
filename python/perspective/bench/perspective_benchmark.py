################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import os
import sys
from functools import partial
from bench import Benchmark, Suite, Runner
sys.path.insert(1, os.path.join(os.path.dirname(__file__), '..'))
from perspective import Table  # noqa: E402
from perspective.tests.common import superstore  # noqa: E402

SUPERSTORE = superstore(9994)

SUPERSTORE_ARROW = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "..",
    "examples",
    "simple",
    "superstore.arrow")


def make_meta(group, name):
    return {
        "group": group,
        "name": name,
        "version": "master"
    }


class PerspectiveBenchmark(Suite):

    AGG_OPTIONS = [
        [{"column": "Sales", "op": "sum"}],
        [{"column": "State", "op": "dominant"}],
        [{"column": "Order Date", "op": "dominant"}]
    ]
    COLUMN_PIVOT_OPTIONS = [[], ["Sub-Category"], ["Category", "Sub-Category"]]
    ROW_PIVOT_OPTIONS = [[], ["State"], ["State", "City"]]

    VERSION = "master"

    def __init__(self):
        """Create a benchmark suite for `perspective-python`."""
        tbl = Table(SUPERSTORE)
        self._view = tbl.view()
        self.dict = self._view.to_dict()
        self.records = self._view.to_records()
        self.df = SUPERSTORE
        self.csv = self._view.to_csv()
        self.arrow = self._view.to_arrow()
        self._table = tbl

    def register_benchmarks(self):
        """Register all the benchmark methods - each method creates a number of
        lambdas, and then calls `setattr` on the Suite itself so that the
        `Runner` can find the tests at runtime."""
        self.benchmark_table()
        self.benchmark_table_arrow()
        self.benchmark_view_zero()
        self.benchmark_view_one()
        self.benchmark_view_two()
        self.benchmark_view_two_column_only()
        self.benchmark_to_format_zero()
        self.benchmark_to_format_one()
        self.benchmark_to_format_two()
        self.benchmark_to_format_two_column_only()

    def benchmark_table(self):
        """Benchmark table creation from different formats."""
        for name in ("df", "dict", "records"):
            data = getattr(self, name)
            test_meta = make_meta("table", name)
            func = Benchmark(lambda: Table(data), meta=test_meta)
            setattr(self, "table_{0}".format(name), func)

    def benchmark_table_arrow(self):
        """Benchmark table from arrow separately as it requires opening the
        Arrow file from the filesystem."""
        with open(SUPERSTORE_ARROW, "rb") as arrow:
            data = arrow.read()
            test_meta = make_meta("table", "arrow")
            func = Benchmark(lambda: Table(data), meta=test_meta)
            setattr(self, "table_arrow", func)

    def benchmark_view_zero(self):
        """Benchmark view creation with zero pivots."""
        func = Benchmark(lambda: self._table.view(), meta=make_meta("view", "zero"))
        setattr(self, "view_zero", func)

    def benchmark_view_one(self):
        """Benchmark view creation with different pivots."""
        for pivot in PerspectiveBenchmark.ROW_PIVOT_OPTIONS:
            if len(pivot) == 0:
                continue
            test_meta = make_meta("view", "one_{0}_pivot".format(len(pivot)))
            view_constructor = partial(self._table.view, row_pivots=pivot)
            func = Benchmark(lambda: view_constructor(), meta=test_meta)
            setattr(self, "view_{0}".format(test_meta["name"]), func)

    def benchmark_view_two(self):
        """Benchmark view creation with row and column pivots."""
        for i in range(len(PerspectiveBenchmark.ROW_PIVOT_OPTIONS)):
            RP = PerspectiveBenchmark.ROW_PIVOT_OPTIONS[i]
            CP = PerspectiveBenchmark.COLUMN_PIVOT_OPTIONS[i]
            if len(RP) == 0 and len(CP) == 0:
                continue
            test_meta = make_meta(
                "view", "two_{0}x{1}_pivot".format(len(RP), len(CP)))
            view_constructor = partial(
                self._table.view, row_pivots=RP, column_pivots=CP)
            func = Benchmark(lambda: view_constructor(), meta=test_meta)
            setattr(self, "view_{0}".format(test_meta["name"]), func)

    def benchmark_view_two_column_only(self):
        """Benchmark column-only view creation."""
        for pivot in PerspectiveBenchmark.COLUMN_PIVOT_OPTIONS:
            if len(pivot) == 0:
                continue
            test_meta = make_meta(
                "view", "two_column_only_{0}_pivot".format(len(pivot)))
            view_constructor = partial(self._table.view, column_pivots=pivot)
            func = Benchmark(lambda: view_constructor(), meta=test_meta)
            setattr(self, "view_{0}".format(test_meta["name"]), func)

    def benchmark_to_format_zero(self):
        """Benchmark each `to_format` method."""
        for name in ("numpy", "dict", "records", "df", "arrow"):
            test_meta = make_meta("to_format", name)
            func = Benchmark(
                lambda: getattr(self._view, "to_{0}".format(name))(), meta=test_meta)
            setattr(self, "to_format_{0}".format(name), func)

    def benchmark_to_format_one(self):
        """Benchmark each `to_format` method for one-sided contexts."""
        for name in ("numpy", "dict", "records", "df", "arrow"):
            for pivot in PerspectiveBenchmark.ROW_PIVOT_OPTIONS:
                if len(pivot) == 0:
                    continue
                test_meta = make_meta(
                    "to_format", "{0}_{1}".format(name, len(pivot)))
                view = self._table.view(row_pivots=pivot)
                func = Benchmark(
                    lambda: getattr(view, "to_{0}".format(name))(), meta=test_meta)
                setattr(self, "to_format_{0}".format(test_meta["name"]), func)

    def benchmark_to_format_two(self):
        """Benchmark each `to_format` method for two-sided contexts."""
        for name in ("numpy", "dict", "records", "df", "arrow"):
            for i in range(len(PerspectiveBenchmark.ROW_PIVOT_OPTIONS)):
                RP = PerspectiveBenchmark.ROW_PIVOT_OPTIONS[i]
                CP = PerspectiveBenchmark.COLUMN_PIVOT_OPTIONS[i]
                if len(RP) == 0 and len(CP) == 0:
                    continue
                test_meta = make_meta(
                    "to_format", "{0}_{1}x{2}".format(name, len(RP), len(CP)))
                view = self._table.view(row_pivots=RP, column_pivots=CP)
                func = Benchmark(
                    lambda: getattr(view, "to_{0}".format(name))(), meta=test_meta)
                setattr(self, "to_format_{0}".format(test_meta["name"]), func)

    def benchmark_to_format_two_column_only(self):
        """Benchmark each `to_format` method for two-sided column-only
        contexts."""
        for name in ("dict", "records", "df", "arrow"):
            for pivot in PerspectiveBenchmark.COLUMN_PIVOT_OPTIONS:
                if len(pivot) == 0:
                    continue
                test_meta = make_meta(
                    "to_format", "{0}_{1}_column".format(name, len(pivot)))
                view = self._table.view(column_pivots=pivot)
                func = Benchmark(
                    lambda: getattr(view, "to_{0}".format(name))(), meta=test_meta)
                setattr(self, "to_format_{0}".format(test_meta["name"]), func)


if __name__ == "__main__":
    # Initialize a suite and runner, then call `.run()`
    suite = PerspectiveBenchmark()
    runner = Runner(suite)
    runner.run()
