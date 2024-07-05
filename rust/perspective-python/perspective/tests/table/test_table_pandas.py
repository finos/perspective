#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

from datetime import date, datetime
from io import StringIO

import numpy as np
import pandas as pd
from perspective import Table
from pytest import mark


def arrow_bytes_to_pandas(view):
    import pyarrow

    with pyarrow.ipc.open_stream(pyarrow.BufferReader(view.to_arrow())) as reader:
        return reader.read_pandas()


class TestTablePandas(object):
    def test_empty_table(self):
        tbl = Table([])
        assert tbl.size() == 0
        assert tbl.schema() == {}

    def test_table_dataframe(self):
        d = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        data = pd.DataFrame(d)
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.schema() == {"index": "integer", "a": "integer", "b": "integer"}
        assert tbl.view().to_records() == [
            {"a": 1, "b": 2, "index": 0},
            {"a": 3, "b": 4, "index": 1},
        ]

    def test_table_dataframe_column_order(self):
        d = [{"a": 1, "b": 2, "c": 3, "d": 4}, {"a": 3, "b": 4, "c": 5, "d": 6}]
        data = pd.DataFrame(d, columns=["b", "c", "a", "d"])
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.columns() == ["index", "b", "c", "a", "d"]

    def test_table_dataframe_selective_column_order(self):
        d = [{"a": 1, "b": 2, "c": 3, "d": 4}, {"a": 3, "b": 4, "c": 5, "d": 6}]
        data = pd.DataFrame(d, columns=["b", "c", "a"])
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.columns() == ["index", "b", "c", "a"]

    def test_table_dataframe_does_not_mutate(self):
        # make sure we don't mutate the dataframe that a user passes in
        data = pd.DataFrame(
            {
                "a": np.array([None, 1, None, 2], dtype=object),
                "b": np.array([1.5, None, 2.5, None], dtype=object),
            }
        )
        assert data["a"].tolist() == [None, 1, None, 2]
        assert data["b"].tolist() == [1.5, None, 2.5, None]

        tbl = Table(data)
        assert tbl.size() == 4
        assert tbl.schema() == {"index": "integer", "a": "integer", "b": "float"}

        assert data["a"].tolist() == [None, 1, None, 2]
        assert data["b"].tolist() == [1.5, None, 2.5, None]

    @mark.skip(reason="Deprecated support for Series")
    def test_table_date_series(self, util):
        data = util.make_series(freq="D")
        tbl = Table(data)
        assert tbl.size() == 10
        assert tbl.schema() == {"index": "date", "0": "float"}
        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 1)),
            util.to_timestamp(datetime(2000, 1, 2)),
            util.to_timestamp(datetime(2000, 1, 3)),
            util.to_timestamp(datetime(2000, 1, 4)),
            util.to_timestamp(datetime(2000, 1, 5)),
            util.to_timestamp(datetime(2000, 1, 6)),
            util.to_timestamp(datetime(2000, 1, 7)),
            util.to_timestamp(datetime(2000, 1, 8)),
            util.to_timestamp(datetime(2000, 1, 9)),
            util.to_timestamp(datetime(2000, 1, 10)),
        ]

    @mark.skip(reason="Deprecated support for Series")
    def test_table_time_series(self, util):
        data = util.make_series(freq="H")
        tbl = Table(data)
        assert tbl.size() == 10
        assert tbl.schema() == {"index": "datetime", "0": "float"}
        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 1, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 2, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 3, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 4, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 5, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 6, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 7, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 8, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 9, 0, 0)),
        ]

    @mark.skip(reason="pyarrow dataframe does not support date inference")
    def test_table_dataframe_infer_date(self, util):
        data = util.make_dataframe(freq="M")

        tbl = Table(data)
        assert tbl.size() == 10
        assert tbl.schema() == {
            "index": "date",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 31)),
            util.to_timestamp(datetime(2000, 2, 29)),
            util.to_timestamp(datetime(2000, 3, 31)),
            util.to_timestamp(datetime(2000, 4, 30)),
            util.to_timestamp(datetime(2000, 5, 31)),
            util.to_timestamp(datetime(2000, 6, 30)),
            util.to_timestamp(datetime(2000, 7, 31)),
            util.to_timestamp(datetime(2000, 8, 31)),
            util.to_timestamp(datetime(2000, 9, 30)),
            util.to_timestamp(datetime(2000, 10, 31)),
        ]

    def test_table_dataframe_infer_date_fixed(self, util):
        data = util.make_dataframe(freq="M")

        tbl = Table(data)
        assert tbl.size() == 10
        assert tbl.schema() == {
            "index": "datetime",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 31)),
            util.to_timestamp(datetime(2000, 2, 29)),
            util.to_timestamp(datetime(2000, 3, 31)),
            util.to_timestamp(datetime(2000, 4, 30)),
            util.to_timestamp(datetime(2000, 5, 31)),
            util.to_timestamp(datetime(2000, 6, 30)),
            util.to_timestamp(datetime(2000, 7, 31)),
            util.to_timestamp(datetime(2000, 8, 31)),
            util.to_timestamp(datetime(2000, 9, 30)),
            util.to_timestamp(datetime(2000, 10, 31)),
        ]

    def test_table_dataframe_infer_time(self, util):
        data = util.make_dataframe(freq="H")

        tbl = Table(data)
        assert tbl.size() == 10
        assert tbl.schema() == {
            "index": "datetime",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 1, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 2, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 3, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 4, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 5, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 6, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 7, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 8, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 9, 0, 0)),
        ]

    @mark.skip(reason="pyarrow dataframe does not support date inference")
    def test_table_dataframe_year_start_index(self, util):
        data = util.make_dataframe(freq="AS")

        tbl = Table(data)
        assert tbl.size() == 10
        assert tbl.schema() == {
            "index": "date",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2001, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2002, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2003, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2004, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2005, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2006, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2007, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2008, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2009, 1, 1, 0, 0, 0)),
        ]

    def test_table_dataframe_year_start_index_fixed(self, util):
        data = util.make_dataframe(freq="AS")

        tbl = Table(data)
        assert tbl.size() == 10
        assert tbl.schema() == {
            "index": "datetime",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2001, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2002, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2003, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2004, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2005, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2006, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2007, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2008, 1, 1, 0, 0, 0)),
            util.to_timestamp(datetime(2009, 1, 1, 0, 0, 0)),
        ]

    @mark.skip(reason="pyarrow dataframe does not support date inference")
    def test_table_dataframe_quarter_index(self, util):
        data = util.make_dataframe(size=4, freq="Q")

        tbl = Table(data)
        assert tbl.size() == 4
        assert tbl.schema() == {
            "index": "date",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 3, 31, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 6, 30, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 9, 30, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 12, 31, 0, 0, 0)),
        ]

    def test_table_dataframe_quarter_index_fixed(self, util):
        data = util.make_dataframe(size=4, freq="Q")

        tbl = Table(data)
        assert tbl.size() == 4
        assert tbl.schema() == {
            "index": "datetime",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 3, 31, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 6, 30, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 9, 30, 0, 0, 0)),
            util.to_timestamp(datetime(2000, 12, 31, 0, 0, 0)),
        ]

    def test_table_dataframe_minute_index(self, util):
        data = util.make_dataframe(size=5, freq="min")

        tbl = Table(data)
        assert tbl.size() == 5
        assert tbl.schema() == {
            "index": "datetime",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"] == [
            util.to_timestamp(datetime(2000, 1, 1, 0, 0)),
            util.to_timestamp(datetime(2000, 1, 1, 0, 1)),
            util.to_timestamp(datetime(2000, 1, 1, 0, 2)),
            util.to_timestamp(datetime(2000, 1, 1, 0, 3)),
            util.to_timestamp(datetime(2000, 1, 1, 0, 4)),
        ]

    def test_table_pandas_periodindex(self, util):
        df = util.make_period_dataframe(30)
        tbl = Table(df)

        assert tbl.size() == 30
        assert tbl.schema() == {
            "index": "integer",
            "a": "float",
            "b": "float",
            "c": "float",
            "d": "float",
        }

        assert tbl.view().to_columns()["index"][:5] == [360, 361, 362, 363, 364]

    @mark.skip(reason="pyarrow does not support this")
    def test_table_pandas_period(self, util):
        df = pd.DataFrame(
            {
                "a": [
                    pd.Period("1Q2019"),
                    pd.Period("2Q2019"),
                    pd.Period("3Q2019"),
                    pd.Period("4Q2019"),
                ]
            }
        )
        tbl = Table(df)
        assert tbl.size() == 4
        assert tbl.schema() == {"index": "integer", "a": "datetime"}
        assert tbl.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 1, 1)),
            util.to_timestamp(datetime(2019, 4, 1)),
            util.to_timestamp(datetime(2019, 7, 1)),
            util.to_timestamp(datetime(2019, 10, 1)),
        ]

    def test_table_pandas_from_schema_int(self):
        data = [None, 1, None, 2, None, 3, 4]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "integer"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_pandas_from_schema_bool(self):
        data = [True, False, True, False]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "boolean"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    @mark.skip(reason="pyarrow does not support this")
    def test_table_pandas_from_schema_bool_str(self):
        data = ["True", "False", "True", "False"]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "boolean"})
        table.update(df)
        assert table.view().to_columns()["a"] == [True, False, True, False]

    def test_table_pandas_from_schema_float(self):
        data = [None, 1.5, None, 2.5, None, 3.5, 4.5]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "float"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_pandas_from_schema_float_all_nan(self):
        data = [np.nan, np.nan, np.nan, np.nan]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "float"})
        table.update(df)
        assert table.view().to_columns()["a"] == [None, None, None, None]

    def test_table_pandas_from_schema_float_to_int(self):
        data = [None, 1.5, None, 2.5, None, 3.5, 4.5]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "integer"})
        table.update(df)
        # truncates decimal
        assert table.view().to_columns()["a"] == [None, 1, None, 2, None, 3, 4]

    def test_table_pandas_from_schema_int_to_float(self):
        data = [None, 1, None, 2, None, 3, 4]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "float"})
        table.update(df)
        assert table.view().to_columns()["a"] == [None, 1.0, None, 2.0, None, 3.0, 4.0]

    def test_table_pandas_from_schema_date(self, util):
        data = [date(2019, 8, 15), None, date(2019, 8, 16)]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "date"})
        table.update(df)
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 8, 15)),
            None,
            util.to_timestamp(datetime(2019, 8, 16)),
        ]

    def test_table_pandas_from_schema_datetime(self, util):
        data = [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            None,
        ]
        df = pd.DataFrame({"a": pd.to_datetime(data, unit="ms")})
        table = Table({"a": "datetime"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_pandas_from_schema_datetime_timestamp_s(self, util):
        data = [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            np.nan,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            np.nan,
        ]
        df = pd.DataFrame({"a": pd.to_datetime(data, unit="ms")})
        table = Table({"a": "datetime"})
        table.update(df)
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            None,
        ]

    @mark.skip(reason="This is no longer relevant")
    def test_table_pandas_from_schema_datetime_timestamp_ms(self, util):
        data = [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)) * 1000,
            np.nan,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            *1000,
            np.nan,
        ]

        df = pd.DataFrame({"a": pd.to_datetime(data, unit="ms")})
        table = Table({"a": "datetime"})
        table.update(df)
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            None,
        ]

    def test_table_pandas_from_schema_str(self):
        data = ["a", None, "b", None, "c"]
        df = pd.DataFrame({"a": data})
        table = Table({"a": "string"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_pandas_none(self):
        data = [None, None, None]
        df = pd.DataFrame({"a": data})
        table = Table(df)
        assert table.view().to_columns()["a"] == data

    def test_table_pandas_symmetric_table(self):
        # make sure that updates are symmetric to table creation
        df = pd.DataFrame({"a": [1, 2, 3, 4], "b": [1.5, 2.5, 3.5, 4.5]})
        t1 = Table(df)
        t2 = Table({"a": "integer", "b": "float"})
        t2.update(df)
        assert t1.view().to_columns() == {
            "index": [0, 1, 2, 3],
            "a": [1, 2, 3, 4],
            "b": [1.5, 2.5, 3.5, 4.5],
        }

    def test_table_pandas_symmetric_stacked_updates(self):
        # make sure that updates are symmetric to table creation
        df = pd.DataFrame({"a": [1, 2, 3, 4], "b": [1.5, 2.5, 3.5, 4.5]})

        t1 = Table(df)
        t1.update(df)

        t2 = Table({"a": "integer", "b": "float"})
        t2.update(df)
        t2.update(df)

        assert t1.view().to_columns() == {
            "index": [0, 1, 2, 3, 0, 1, 2, 3],
            "a": [1, 2, 3, 4, 1, 2, 3, 4],
            "b": [1.5, 2.5, 3.5, 4.5, 1.5, 2.5, 3.5, 4.5],
        }

    def test_table_pandas_transitive(self):
        # serialized output -> table -> serialized output
        records = {
            "a": [1, 2, 3, 4],
            "b": [1.5, 2.5, 3.5, 4.5],
            "c": [np.nan, np.nan, "abc", np.nan],
            "d": [None, True, None, False],
            "e": [
                float("nan"),
                datetime(2019, 7, 11, 12, 30),
                float("nan"),
                datetime(2019, 7, 11, 12, 30),
            ],
        }

        df = pd.DataFrame(records)
        t1 = Table(df)
        out1 = arrow_bytes_to_pandas(t1.view(columns=["a", "b", "c", "d", "e"]))
        t2 = Table(out1)
        assert t1.schema() == t2.schema()
        out2 = t2.view().to_columns()
        assert t1.view().to_columns() == out2

    # dtype=object should have correct inferred types

    def test_table_pandas_object_to_int(self):
        df = pd.DataFrame({"a": np.array([1, 2, None, 2, None, 3, 4], dtype=object)})
        table = Table(df)
        assert table.schema() == {"index": "integer", "a": "integer"}
        assert table.view().to_columns()["a"] == [1, 2, None, 2, None, 3, 4]

    def test_table_pandas_object_to_float(self):
        df = pd.DataFrame({"a": np.array([None, 1, None, 2, None, 3, 4], dtype=object)})
        table = Table(df)
        assert table.schema() == {"index": "integer", "a": "integer"}
        assert table.view().to_columns()["a"] == [None, 1.0, None, 2.0, None, 3.0, 4.0]

    def test_table_pandas_object_to_bool(self):
        df = pd.DataFrame({"a": np.array([True, False, True, False, True, False], dtype=object)})
        table = Table(df)
        assert table.schema() == {"index": "integer", "a": "boolean"}
        assert table.view().to_columns()["a"] == [True, False, True, False, True, False]

    def test_table_pandas_object_to_date(self, util):
        df = pd.DataFrame({"a": np.array([date(2019, 7, 11), date(2019, 7, 12), None], dtype=object)})
        table = Table(df)
        assert table.schema() == {"index": "integer", "a": "date"}
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 7, 11)),
            util.to_timestamp(datetime(2019, 7, 12)),
            None,
        ]

    def test_table_pandas_object_to_datetime(self, util):
        df = pd.DataFrame(
            {
                "a": np.array(
                    [
                        datetime(2019, 7, 11, 1, 2, 3),
                        datetime(2019, 7, 12, 1, 2, 3),
                        None,
                    ],
                    dtype=object,
                )
            }
        )
        table = Table(df)
        assert table.schema() == {"index": "integer", "a": "datetime"}
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 7, 11, 1, 2, 3)),
            util.to_timestamp(datetime(2019, 7, 12, 1, 2, 3)),
            None,
        ]

    def test_table_pandas_object_to_str(self):
        df = pd.DataFrame({"a": np.array(["abc", "def", None, "ghi"], dtype=object)})
        table = Table(df)
        assert table.schema() == {"index": "integer", "a": "string"}
        assert table.view().to_columns()["a"] == ["abc", "def", None, "ghi"]

    # Type matching

    def test_table_pandas_update_float_schema_with_int(self):
        df = pd.DataFrame({"a": [1.5, 2.5, 3.5, 4.5], "b": [1, 2, 3, 4]})

        table = Table({"a": "float", "b": "float"})

        table.update(df)

        assert table.view().to_columns() == {
            "a": [1.5, 2.5, 3.5, 4.5],
            "b": [1.0, 2.0, 3.0, 4.0],
        }

    def test_table_pandas_update_int32_with_int64(self):
        df = pd.DataFrame({"a": [1, 2, 3, 4]})

        table = Table({"a": [1, 2, 3, 4]})

        table.update(df)

        assert table.view().to_columns() == {"a": [1, 2, 3, 4, 1, 2, 3, 4]}

    def test_table_pandas_update_int64_with_float(self):
        df = pd.DataFrame({"a": [1.5, 2.5, 3.5, 4.5]})

        table = Table(pd.DataFrame({"a": [1, 2, 3, 4]}))

        table.update(df)

        assert table.view().to_columns()["a"] == [1, 2, 3, 4, 1, 2, 3, 4]

    def test_table_pandas_update_date_schema_with_datetime(self, util):
        df = pd.DataFrame({"a": np.array([date(2019, 7, 11)])})

        table = Table({"a": "date"})

        table.update(df)

        assert table.schema() == {"a": "date"}

        assert table.view().to_columns() == {"a": [util.to_timestamp(datetime(2019, 7, 11))]}

    @mark.skip(reason="Not supported by pyarrow (?)")
    def test_table_pandas_update_datetime_schema_with_date(self, util):
        df = pd.DataFrame({"a": np.array([date(2019, 7, 11)])})
        table = Table({"a": "datetime"})
        table.update(df)
        assert table.schema() == {"a": "datetime"}
        assert table.view().to_columns() == {"a": [util.to_timestamp(datetime(2019, 7, 11, 0, 0))]}

    # Timestamps

    def test_table_pandas_timestamp_to_datetime(self, util):
        data = [
            pd.Timestamp("2019-07-11 12:30:05"),
            None,
            pd.Timestamp("2019-07-11 13:30:05"),
            None,
        ]
        df = pd.DataFrame({"a": data})
        table = Table(df)
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            None,
        ]

    def test_table_pandas_timestamp_explicit_dtype(self, util):
        data = [
            pd.Timestamp("2019-07-11 12:30:05"),
            None,
            pd.Timestamp("2019-07-11 13:30:05"),
            None,
        ]
        df = pd.DataFrame({"a": np.array(data, dtype="datetime64[ns]")})
        table = Table(df)
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            None,
        ]

    def test_table_pandas_update_datetime_with_timestamp(self, util):
        data = [
            pd.Timestamp("2019-07-11 12:30:05"),
            None,
            pd.Timestamp("2019-07-11 13:30:05"),
            None,
        ]
        df = pd.DataFrame({"a": data})
        df2 = pd.DataFrame({"a": data})
        table = Table(df)
        table.update(df2)
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 12, 30, 5)),
            None,
            util.to_timestamp(datetime(2019, 7, 11, 13, 30, 5)),
            None,
        ]

    # NaN/NaT reading

    def test_table_pandas_nan(self):
        data = [np.nan, np.nan, np.nan, np.nan]
        df = pd.DataFrame({"a": data})
        table = Table(df)
        assert table.view().to_columns()["a"] == [None, None, None, None]

    def test_table_pandas_int_nan(self):
        data = [np.nan, 1, np.nan, 2]
        df = pd.DataFrame({"a": data})
        table = Table(df)
        assert table.view().to_columns()["a"] == [None, 1, None, 2]

    def test_table_pandas_float_nan(self):
        data = [np.nan, 1.5, np.nan, 2.5]
        df = pd.DataFrame({"a": data})
        table = Table(df)
        assert table.view().to_columns()["a"] == [None, 1.5, None, 2.5]

    def test_table_read_nan_int_col(self):
        data = pd.DataFrame({"str": ["abc", float("nan"), "def"], "int": [np.nan, 1, 2]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "int": "float",
        }  # np.nan is float type - ints convert to floats when filled in
        assert tbl.size() == 3
        assert tbl.view().to_columns() == {
            "index": [0, 1, 2],
            "str": ["abc", None, "def"],
            "int": [None, 1.0, 2.0],
        }

    def test_table_read_nan_float_col(self):
        data = pd.DataFrame({"str": [float("nan"), "abc", float("nan")], "float": [np.nan, 1.5, 2.5]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "float": "float",
        }  # can only promote to string or float
        assert tbl.size() == 3
        assert tbl.view().to_columns() == {
            "index": [0, 1, 2],
            "str": [None, "abc", None],
            "float": [None, 1.5, 2.5],
        }

    def test_table_read_nan_bool_col(self):
        data = pd.DataFrame({"bool": [np.nan, True, np.nan], "bool2": [False, np.nan, True]})
        tbl = Table(data)
        # if np.nan begins a column, it is inferred as float and then can be promoted. if np.nan is in the values (but not at start), the column type is whatever is inferred.
        assert tbl.schema() == {
            "index": "integer",
            "bool": "boolean",
            "bool2": "boolean",
        }
        assert tbl.size() == 3
        # np.nans are always serialized as None
        assert tbl.view().to_columns() == {
            "index": [0, 1, 2],
            "bool": [None, True, None],
            "bool2": [False, None, True],
        }

    def test_table_read_nan_date_col(self):
        data = pd.DataFrame({"str": ["abc", "def"], "date": [float("nan"), date(2019, 7, 11)]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "date": "date",
        }  # can only promote to string or float
        assert tbl.size() == 2
        assert tbl.view().to_columns() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "date": [None, 1562803200000],
        }

    def test_table_read_nan_datetime_col(self, util):
        data = pd.DataFrame(
            {
                "str": ["abc", "def"],
                "datetime": [float("nan"), datetime(2019, 7, 11, 11, 0)],
            }
        )
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "datetime": "datetime",
        }  # can only promote to string or float
        assert tbl.size() == 2
        assert tbl.view().to_columns() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, util.to_timestamp(datetime(2019, 7, 11, 11, 0))],
        }

    def test_table_read_nat_datetime_col(self, util):
        data = pd.DataFrame({"str": ["abc", "def"], "datetime": ["NaT", datetime(2019, 7, 11, 11, 0)]})
        # datetime col is `datetime` in pandas<2, `object` in pandas>=2, so convert
        data.datetime = pd.to_datetime(data.datetime)
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "datetime": "datetime",
        }  # can only promote to string or float
        assert tbl.size() == 2
        assert tbl.view().to_columns() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, util.to_timestamp(datetime(2019, 7, 11, 11, 0))],
        }

    def test_table_read_nan_datetime_as_date_col(self, util):
        data = pd.DataFrame({"str": ["abc", "def"], "datetime": [float("nan"), datetime(2019, 7, 11)]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "datetime": "datetime",
        }  # can only promote to string or float
        assert tbl.size() == 2
        assert tbl.view().to_columns() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, util.to_timestamp(datetime(2019, 7, 11))],
        }

    def test_table_read_nan_datetime_no_seconds(self, util):
        data = pd.DataFrame(
            {
                "str": ["abc", "def"],
                "datetime": [float("nan"), datetime(2019, 7, 11, 11, 0)],
            }
        )
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "datetime": "datetime",
        }  # can only promote to string or float
        assert tbl.size() == 2
        assert tbl.view().to_columns() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, util.to_timestamp(datetime(2019, 7, 11, 11, 0))],
        }

    def test_table_read_nan_datetime_milliseconds(self, util):
        data = pd.DataFrame(
            {
                "str": ["abc", "def"],
                "datetime": [np.nan, datetime(2019, 7, 11, 10, 30, 55)],
            }
        )
        tbl = Table(data)
        assert tbl.schema() == {
            "index": "integer",
            "str": "string",
            "datetime": "datetime",
        }  # can only promote to string or float
        assert tbl.size() == 2
        assert tbl.view().to_columns() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, util.to_timestamp(datetime(2019, 7, 11, 10, 30, 55))],
        }

    @mark.skip(reason="lol wtf")
    def test_table_pandas_correct_csv_nan_end(self):
        s = "string,\nint\n,1\n,2\nabc,3"
        csv = StringIO(s)
        data = pd.read_csv(csv)
        tbl = Table(data)
        assert tbl.schema() == {"index": "integer", "str": "string", "int": "integer"}
        assert tbl.size() == 3
        assert tbl.view().to_columns() == {
            "index": [0, 1, 2],
            "str": [None, None, "abc"],
            "int": [1, 2, 3],
        }

    @mark.skip(reason="lol wtf")
    def test_table_pandas_correct_csv_nan_intermittent(self):
        s = "string,\nfloat\nabc,\n,2\nghi,"
        csv = StringIO(s)
        data = pd.read_csv(csv)
        tbl = Table(data)
        assert tbl.schema() == {"index": "integer", "str": "string", "float": "float"}
        assert tbl.size() == 3
        assert tbl.view().to_columns() == {
            "index": [0, 1, 2],
            "str": ["abc", None, "ghi"],
            "float": [None, 2, None],
        }

    @mark.skip(reason="pyarrow does not support series")
    def test_table_series(self):
        import pandas as pd

        data = pd.Series([1, 2, 3], name="a")
        tbl = Table(data)
        assert tbl.size() == 3

    @mark.skip(reason="pyarrow does not support series")
    def test_table_indexed_series(self):
        import pandas as pd

        data = pd.Series([1, 2, 3], index=["a", "b", "c"], name="a")
        tbl = Table(data)
        assert tbl.schema() == {"index": "string", "a": "integer"}
        assert tbl.size() == 3

    def test_groupbys(self, superstore):
        df_pivoted = superstore.set_index(["Country", "Region"])
        table = Table(df_pivoted)
        columns = table.columns()
        assert table.size() == 100
        assert "Country" in columns
        assert "Region" in columns

    def test_pivottable(self, superstore):
        pt = pd.pivot_table(
            superstore,
            values="Discount",
            index=["Country", "Region"],
            columns="Category",
        )
        table = Table(pt)
        columns = table.columns()
        assert "Country" in columns
        assert "Region" in columns

    @mark.skip(reason="TODO move this to Python")
    def test_splitbys(self):
        arrays = [
            np.array(
                [
                    "bar",
                    "bar",
                    "bar",
                    "bar",
                    "baz",
                    "baz",
                    "baz",
                    "baz",
                    "foo",
                    "foo",
                    "foo",
                    "foo",
                    "qux",
                    "qux",
                    "qux",
                    "qux",
                ]
            ),
            np.array(
                [
                    "one",
                    "one",
                    "two",
                    "two",
                    "one",
                    "one",
                    "two",
                    "two",
                    "one",
                    "one",
                    "two",
                    "two",
                    "one",
                    "one",
                    "two",
                    "two",
                ]
            ),
            np.array(
                [
                    "X",
                    "Y",
                    "X",
                    "Y",
                    "X",
                    "Y",
                    "X",
                    "Y",
                    "X",
                    "Y",
                    "X",
                    "Y",
                    "X",
                    "Y",
                    "X",
                    "Y",
                ]
            ),
        ]
        tuples = list(zip(*arrays))
        index = pd.MultiIndex.from_tuples(tuples, names=["first", "second", "third"])
        df_both = pd.DataFrame(np.random.randn(3, 16), index=["A", "B", "C"], columns=index)
        table = Table(df_both)
        assert table.size() == 48
