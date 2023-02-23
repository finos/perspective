################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import os
import random
import pandas as pd
from functools import partial
from bench import Benchmark, Suite, Runner
from perspective import Table
from perspective.tests.common import superstore

SUPERSTORE = superstore(9994)

SUPERSTORE_ARROW = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "node_modules",
    "superstore-arrow",
    "superstore.arrow",
)

VERSIONS = ["master", "0.4.1", "0.4.0rc6"]


def make_meta(group, name):
    return {"group": group, "name": name}


def empty_callback(port_id):
    pass


class PerspectiveBenchmark(Suite):
    AGG_OPTIONS = [
        [{"column": "Sales", "op": "sum"}],
        [{"column": "State", "op": "dominant"}],
        [{"column": "Order Date", "op": "dominant"}],
    ]
    split_by_OPTIONS = [[], ["Sub-Category"], ["Category", "Sub-Category"]]
    group_by_OPTIONS = [[], ["State"], ["State", "City"]]

    def __init__(self):
        """Create a benchmark suite for the `perspective-python` runtime."""
        tbl = Table(SUPERSTORE)
        self._schema = tbl.schema()
        self._df_schema = tbl.schema()
        # mutate schema to have some integer columns, so as to force numpy
        # float-to-int demotion
        self._df_schema["Sales"] = int
        self._df_schema["Profit"] = int
        self._df_schema["Quantity"] = int
        self._view = tbl.view()
        self.dict = self._view.to_dict()
        self.records = self._view.to_records()
        self.df = SUPERSTORE
        self.csv = self._view.to_csv()
        self.arrow = self._view.to_arrow()
        self._table = tbl

    def _get_update_data(self, n=30):
        """Retrieve n rows from self.records to be used as update data."""
        return random.sample(self.records, n)

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
        self.benchmark_view_zero_updates()
        self.benchmark_view_one_updates()
        self.benchmark_view_two_updates()
        self.benchmark_view_two_column_only_updates()
        self.benchmark_view_zero_df_updates()
        self.benchmark_view_one_df_updates()
        self.benchmark_view_two_df_updates()
        self.benchmark_view_two_column_only_df_updates()
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

    def benchmark_view_zero_updates(self):
        """Benchmark how long it takes for each update to resolve fully, using
        the on update callback that forces resolution of updates across
        10 views."""
        table = Table(self._schema)
        views = [table.view() for i in range(25)]
        for v in views:
            v.on_update(empty_callback)
        update_data = self._get_update_data(1000)

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "zero"))
        setattr(self, "update_zero", func)

    def benchmark_view_zero_df_updates(self):
        """Benchmark how long it takes for each update to resolve fully, using
        the on update callback that forces resolution of updates across
        10 views. This version updates using dataframes, and is designed to
        compare the overhead of dataframe loading vs. regular data structure
        loading."""
        table = Table(self._df_schema)
        views = [table.view() for i in range(25)]
        for v in views:
            v.on_update(empty_callback)
        update_data = pd.DataFrame(self._get_update_data(1000))

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "zero_df"))
        setattr(self, "update_zero_df", func)

    def benchmark_view_one(self):
        """Benchmark view creation with different pivots."""
        for pivot in PerspectiveBenchmark.group_by_OPTIONS:
            if len(pivot) == 0:
                continue
            test_meta = make_meta("view", "one_{0}_pivot".format(len(pivot)))
            view_constructor = partial(self._table.view, group_by=pivot)
            func = Benchmark(lambda: view_constructor(), meta=test_meta)
            setattr(self, "view_{0}".format(test_meta["name"]), func)

    def benchmark_view_one_updates(self):
        """Benchmark how long it takes for each update to resolve fully, using
        the on update callback that forces resolution of updates across
        25 views."""
        table = Table(self._schema)
        views = [table.view(group_by=["State", "City"]) for i in range(25)]
        for v in views:
            v.on_update(empty_callback)
        update_data = self._get_update_data(1000)

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "one"))
        setattr(self, "update_one", func)

    def benchmark_view_one_df_updates(self):
        """Benchmark dataframe updates for one-sided views."""
        table = Table(self._df_schema)
        views = [table.view(group_by=["State", "City"]) for i in range(25)]
        for v in views:
            v.on_update(empty_callback)
        update_data = pd.DataFrame(self._get_update_data(1000))

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "one_df"))
        setattr(self, "update_one_df", func)

    def benchmark_view_two(self):
        """Benchmark view creation with row and Split By."""
        for i in range(len(PerspectiveBenchmark.group_by_OPTIONS)):
            RP = PerspectiveBenchmark.group_by_OPTIONS[i]
            CP = PerspectiveBenchmark.split_by_OPTIONS[i]
            if len(RP) == 0 and len(CP) == 0:
                continue
            test_meta = make_meta("view", "two_{0}x{1}_pivot".format(len(RP), len(CP)))
            view_constructor = partial(self._table.view, group_by=RP, split_by=CP)
            func = Benchmark(lambda: view_constructor(), meta=test_meta)
            setattr(self, "view_{0}".format(test_meta["name"]), func)

    def benchmark_view_two_updates(self):
        """Benchmark how long it takes for each update to resolve fully, using
        the on update callback that forces resolution of updates across
        25 views."""
        table = Table(self._schema)
        views = [
            table.view(
                group_by=["State", "City"], split_by=["Category", "Sub-Category"]
            )
            for i in range(25)
        ]
        for v in views:
            v.on_update(empty_callback)
        update_data = self._get_update_data(1000)

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "two"))
        setattr(self, "update_two", func)

    def benchmark_view_two_df_updates(self):
        """Benchmark dataframe updates for two-sided views."""
        table = Table(self._df_schema)
        views = [
            table.view(
                group_by=["State", "City"], split_by=["Category", "Sub-Category"]
            )
            for i in range(25)
        ]
        for v in views:
            v.on_update(empty_callback)
        update_data = pd.DataFrame(self._get_update_data(1000))

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "two_df"))
        setattr(self, "update_two_df", func)

    def benchmark_view_two_column_only(self):
        """Benchmark column-only view creation."""
        for pivot in PerspectiveBenchmark.split_by_OPTIONS:
            if len(pivot) == 0:
                continue
            test_meta = make_meta(
                "view", "two_column_only_{0}_pivot".format(len(pivot))
            )
            view_constructor = partial(self._table.view, split_by=pivot)
            func = Benchmark(lambda: view_constructor(), meta=test_meta)
            setattr(self, "view_{0}".format(test_meta["name"]), func)

    def benchmark_view_two_column_only_updates(self):
        """Benchmark how long it takes for each update to resolve fully, using
        the on update callback that forces resolution of updates across
        25 views."""
        table = Table(self._schema)
        views = [table.view(split_by=["Category", "Sub-Category"]) for i in range(25)]
        for v in views:
            v.on_update(empty_callback)
        update_data = self._get_update_data(1000)

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "two_column_only"))
        setattr(self, "update_two_column_only", func)

    def benchmark_view_two_column_only_df_updates(self):
        """Benchmark dataframe updates for two-sided column only views."""
        table = Table(self._df_schema)
        views = [table.view(split_by=["Category", "Sub-Category"]) for i in range(25)]
        for v in views:
            v.on_update(empty_callback)
        update_data = pd.DataFrame(self._get_update_data(1000))

        def resolve_update():
            table.update(update_data)
            table.size()

        func = Benchmark(resolve_update, meta=make_meta("update", "two_column_only_df"))
        setattr(self, "update_two_column_only_df", func)

    def benchmark_to_format_zero(self):
        """Benchmark each `to_format` method."""
        for name in ("numpy", "dict", "records", "df", "arrow"):
            test_meta = make_meta("to_format", "to_{}".format(name))
            func = Benchmark(
                lambda: getattr(self._view, "to_{0}".format(name))(), meta=test_meta
            )
            setattr(self, "to_format_{0}".format(name), func)

    def benchmark_to_format_one(self):
        """Benchmark each `to_format` method for one-sided contexts."""
        for name in ("numpy", "dict", "records", "df", "arrow"):
            for pivot in PerspectiveBenchmark.group_by_OPTIONS:
                if len(pivot) == 0:
                    continue
                test_meta = make_meta(
                    "to_format", "to_{0}_r{1}".format(name, len(pivot))
                )
                view = self._table.view(group_by=pivot)
                func = Benchmark(
                    lambda: getattr(view, "to_{0}".format(name))(), meta=test_meta
                )
                setattr(self, "to_format_{0}".format(test_meta["name"]), func)

    def benchmark_to_format_two(self):
        """Benchmark each `to_format` method for two-sided contexts."""
        for name in ("numpy", "dict", "records", "df", "arrow"):
            for i in range(len(PerspectiveBenchmark.group_by_OPTIONS)):
                RP = PerspectiveBenchmark.group_by_OPTIONS[i]
                CP = PerspectiveBenchmark.split_by_OPTIONS[i]
                if len(RP) == 0 and len(CP) == 0:
                    continue
                test_meta = make_meta(
                    "to_format", "to_{0}_r{1}_c{2}".format(name, len(RP), len(CP))
                )
                view = self._table.view(group_by=RP, split_by=CP)
                func = Benchmark(
                    lambda: getattr(view, "to_{0}".format(name))(), meta=test_meta
                )
                setattr(self, "to_format_{0}".format(test_meta["name"]), func)

    def benchmark_to_format_two_column_only(self):
        """Benchmark each `to_format` method for two-sided column-only
        contexts."""
        for name in ("dict", "records", "df", "arrow"):
            for pivot in PerspectiveBenchmark.split_by_OPTIONS:
                if len(pivot) == 0:
                    continue
                test_meta = make_meta(
                    "to_format", "to_{0}_c_{1}".format(name, len(pivot))
                )
                view = self._table.view(split_by=pivot)
                func = Benchmark(
                    lambda: getattr(view, "to_{0}".format(name))(), meta=test_meta
                )
                setattr(self, "to_format_{0}".format(test_meta["name"]), func)


if __name__ == "__main__":
    VERSION = "master"

    # Initialize a suite and runner, then call `.run()`
    suite = PerspectiveBenchmark()
    runner = Runner(suite)

    print("Benchmarking perspective-python=={}".format(VERSION))
    runner.run(VERSION)
    runner.write_results()
