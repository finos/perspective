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
import numpy as np
import polars as pl
from pytest import mark
import perspective as psp

client = psp.Server().new_local_client()
Table = client.table


def arrow_bytes_to_polars(view):
    import pyarrow

    with pyarrow.ipc.open_stream(pyarrow.BufferReader(view.to_arrow())) as reader:
        return pl.from_dataframe(reader.read_pandas())


class TestTablePolars(object):
    def test_empty_table(self):
        tbl = Table([])
        assert tbl.size() == 0
        assert tbl.schema() == {}

    def test_table_dataframe(self):
        d = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        data = pl.DataFrame(d)
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.schema() == {"a": "integer", "b": "integer"}
        assert tbl.view().to_records() == [
            {"a": 1, "b": 2},
            {"a": 3, "b": 4},
        ]

    def test_table_lazyframe(self):
        d = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        data = pl.DataFrame(d).lazy()
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.schema() == {"a": "integer", "b": "integer"}
        assert tbl.view().to_records() == [
            {"a": 1, "b": 2},
            {"a": 3, "b": 4},
        ]

    def test_table_dataframe_column_order(self):
        d = [{"a": 1, "b": 2, "c": 3, "d": 4}, {"a": 3, "b": 4, "c": 5, "d": 6}]
        data = pl.DataFrame(d).select(["b", "c", "a", "d"])
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.columns() == ["b", "c", "a", "d"]

    def test_table_dataframe_selective_column_order(self):
        d = [{"a": 1, "b": 2, "c": 3, "d": 4}, {"a": 3, "b": 4, "c": 5, "d": 6}]
        data = pl.DataFrame(d).select(["b", "c", "a"])
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.columns() == ["b", "c", "a"]

    def test_table_dataframe_does_not_mutate(self):
        # make sure we don't mutate the dataframe that a user passes in
        data = pl.DataFrame(
            {
                "a": [None, 1, None, 2],
                "b": [1.5, None, 2.5, None],
            }
        )
        assert data["a"].to_list() == [None, 1, None, 2]
        assert data["b"].to_list() == [1.5, None, 2.5, None]

        tbl = Table(data)
        assert tbl.size() == 4
        assert tbl.schema() == {"a": "integer", "b": "float"}

        assert data["a"].to_list() == [None, 1, None, 2]
        assert data["b"].to_list() == [1.5, None, 2.5, None]

    def test_table_polars_from_schema_int(self):
        data = [None, 1, None, 2, None, 3, 4]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "integer"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_polars_from_schema_bool(self):
        data = [True, False, True, False]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "boolean"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_polars_from_schema_float(self):
        data = [None, 1.5, None, 2.5, None, 3.5, 4.5]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "float"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_polars_from_schema_float_all_nan(self):
        data = [np.nan, np.nan, np.nan, np.nan]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "float"})
        table.update(df)
        assert table.view().to_columns()["a"] == [None, None, None, None]

    def test_table_polars_from_schema_float_to_int(self):
        data = [None, 1.5, None, 2.5, None, 3.5, 4.5]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "integer"})
        table.update(df)
        # truncates decimal
        assert table.view().to_columns()["a"] == [None, 1, None, 2, None, 3, 4]

    def test_table_polars_from_schema_int_to_float(self):
        data = [None, 1, None, 2, None, 3, 4]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "float"})
        table.update(df)
        assert table.view().to_columns()["a"] == [None, 1.0, None, 2.0, None, 3.0, 4.0]

    def test_table_polars_from_schema_date(self, util):
        data = [date(2019, 8, 15), None, date(2019, 8, 16)]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "date"})
        table.update(df)
        assert table.view().to_columns()["a"] == [
            util.to_timestamp(datetime(2019, 8, 15)),
            None,
            util.to_timestamp(datetime(2019, 8, 16)),
        ]

    def test_table_polars_from_schema_str(self):
        data = ["a", None, "b", None, "c"]
        df = pl.DataFrame({"a": data})
        table = Table({"a": "string"})
        table.update(df)
        assert table.view().to_columns()["a"] == data

    def test_table_polars_none(self):
        data = [None, None, None]
        df = pl.DataFrame({"a": data})
        table = Table(df)
        assert table.view().to_columns()["a"] == data

    def test_table_polars_symmetric_table(self):
        # make sure that updates are symmetric to table creation
        df = pl.DataFrame({"a": [1, 2, 3, 4], "b": [1.5, 2.5, 3.5, 4.5]})
        t1 = Table(df)
        t2 = Table({"a": "integer", "b": "float"})
        t2.update(df)
        assert t1.view().to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [1.5, 2.5, 3.5, 4.5],
        }

    def test_table_polars_symmetric_stacked_updates(self):
        # make sure that updates are symmetric to table creation
        df = pl.DataFrame({"a": [1, 2, 3, 4], "b": [1.5, 2.5, 3.5, 4.5]})

        t1 = Table(df)
        t1.update(df)

        t2 = Table({"a": "integer", "b": "float"})
        t2.update(df)
        t2.update(df)

        assert t1.view().to_columns() == {
            "a": [1, 2, 3, 4, 1, 2, 3, 4],
            "b": [1.5, 2.5, 3.5, 4.5, 1.5, 2.5, 3.5, 4.5],
        }

    @mark.skip(reason="Not supported, polars doesnt like input")
    def test_table_polars_transitive(self):
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

        df = pl.DataFrame(records, strict=False)
        t1 = Table(df)
        out1 = arrow_bytes_to_polars(t1.view(columns=["a", "b", "c", "d", "e"]))
        t2 = Table(out1)
        assert t1.schema() == t2.schema()
        out2 = t2.view().to_columns()
        assert t1.view().to_columns() == out2

    # dtype=object should have correct inferred types

    def test_table_polars_object_to_int(self):
        df = pl.DataFrame({"a": [1, 2, None, 2, None, 3, 4]})
        table = Table(df)
        assert table.schema() == {"a": "integer"}
        assert table.view().to_columns()["a"] == [1, 2, None, 2, None, 3, 4]

    def test_table_polars_object_to_float(self):
        df = pl.DataFrame({"a": [None, 1, None, 2, None, 3, 4]})
        table = Table(df)
        assert table.schema() == {"a": "integer"}
        assert table.view().to_columns()["a"] == [None, 1.0, None, 2.0, None, 3.0, 4.0]

    def test_table_polars_object_to_bool(self):
        df = pl.DataFrame({"a": [True, False, True, False, True, False]})
        table = Table(df)
        assert table.schema() == {"a": "boolean"}
        assert table.view().to_columns()["a"] == [True, False, True, False, True, False]

    def test_table_polars_object_to_datetime(self):
        df = pl.DataFrame(
            {
                "a": [
                    datetime(2019, 7, 11, 1, 2, 3),
                    datetime(2019, 7, 12, 1, 2, 3),
                    None,
                ]
            }
        )

        table = Table(df)
        assert table.schema() == {"a": "datetime"}
        assert table.view().to_columns()["a"] == [
            datetime(2019, 7, 11, 1, 2, 3).timestamp() * 1000,
            datetime(2019, 7, 12, 1, 2, 3).timestamp() * 1000,
            None,
        ]

    def test_table_polars_object_to_str(self):
        df = pl.DataFrame({"a": np.array(["abc", "def", None, "ghi"], dtype=object)})
        table = Table(df)
        assert table.schema() == {"a": "string"}
        assert table.view().to_columns()["a"] == ["abc", "def", None, "ghi"]
