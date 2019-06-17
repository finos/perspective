# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table import Table
from datetime import date, datetime


class TestTable(object):
    # table constructors

    def test_empty_table(self):
        tbl = Table([])
        assert tbl.size() == 0

    def test_table_int(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.schema() == {
            "a": int,
            "b": int
        }

    def test_table_nones(self):
        none_data = [{"a": 1, "b": None}, {"a": None, "b": 2}]
        tbl = Table(none_data)
        assert tbl.size() == 2
        assert tbl.schema() == {
            "a": int,
            "b": int
        }

    def test_table_bool(self):
        bool_data = [{"a": True, "b": False}, {"a": True, "b": True}]
        tbl = Table(bool_data)
        assert tbl.size() == 2
        assert tbl.schema() == {
            "a": bool,
            "b": bool
        }

    def test_table_float(self):
        float_data = [{"a": 1.5, "b": 2.5}, {"a": 3.2, "b": 3.1}]
        tbl = Table(float_data)
        assert tbl.size() == 2
        assert tbl.schema() == {
            "a": float,
            "b": float
        }

    def test_table_str(self):
        str_data = [{"a": "b", "b": "b"}, {"a": "3", "b": "3"}]
        tbl = Table(str_data)
        assert tbl.size() == 2
        assert tbl.schema() == {
            "a": str,
            "b": str
        }

    def test_table_date(self):
        str_data = [{"a": date.today(), "b": date.today()}]
        tbl = Table(str_data)
        assert tbl.size() == 1
        assert tbl.schema() == {
            "a": date,
            "b": date
        }

    def test_table_datetime(self):
        str_data = [{"a": datetime.now(), "b": datetime.now()}]
        tbl = Table(str_data)
        assert tbl.size() == 1
        assert tbl.schema() == {
            "a": datetime,
            "b": datetime
        }

    def test_table_columnar(self):
        data = {"a": [1, 2, 3], "b": [4, 5, 6]}
        tbl = Table(data)
        assert tbl.columns() == ["a", "b"]
        assert tbl.size() == 3
        assert tbl.schema() == {
            "a": int,
            "b": int
        }

    def test_table_columnar_mixed_length(self):
        data = [{"a": 1.5, "b": 2.5}, {"a": 3.2}]
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.schema() == {
            "a": float,
            "b": float
        }
        assert tbl.view().to_records() == [{"a": 1.5, "b": 2.5}, {"a": 3.2, "b": None}]

    # schema

    def test_table_schema(self):
        data = {"a": int,
                "b": float,
                "c": str,
                "d": bool,
                "e": date,
                "f": datetime}

        tbl = Table(data)

        assert tbl.schema() == {
            "a": int,
            "b": float,
            "c": str,
            "d": bool,
            "e": date,
            "f": datetime
        }

    def test_table_readable_string_schema(self):
        data = {"a": "integer",
                "b": "float",
                "c": "string",
                "d": "boolean",
                "e": "date",
                "f": "datetime"}

        tbl = Table(data)

        assert tbl.schema() == {
            "a": int,
            "b": float,
            "c": str,
            "d": bool,
            "e": date,
            "f": datetime
        }

    def test_table_output_readable_schema(self):
        data = {"a": "int32",
                "b": "float64",
                "c": "str",
                "d": "bool",
                "e": "date",
                "f": "datetime"}

        tbl = Table(data)

        assert tbl.schema() == {
            "a": int,
            "b": float,
            "c": str,
            "d": bool,
            "e": date,
            "f": datetime
        }

    def test_table_mixed_schema(self):
        data = {"a": int,
                "b": float,
                "c": str,
                "d": bool,
                "e": date,
                "f": datetime}

        tbl = Table(data)

        assert tbl.schema() == {
            "a": int,
            "b": float,
            "c": str,
            "d": bool,
            "e": date,
            "f": datetime
        }

    def test_table_symmetric_schema(self):
        data = {
            "a": [1, 2, 3],
            "b": [1.5, 2.5, 3.5],
            "c": ["a", "b", "c"],
            "d": [True, False, True],
            "e": [date.today(), date.today(), date.today()],
            "f": [datetime.now(), datetime.now(), datetime.now()]
        }

        tbl = Table(data)
        schema = tbl.schema()

        assert schema == {
            "a": int,
            "b": float,
            "c": str,
            "d": bool,
            "e": date,
            "f": datetime
        }

        tbl2 = Table(schema)

        assert tbl2.schema() == schema

    # index

    def test_table_index(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 4}]
        tbl = Table(data, {"index": "a"})
        assert tbl.size() == 1
        assert tbl.view().to_records() == [
            {"a": 1, "b": 4}
        ]

    # limit

    def test_table_limit(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data, {"limit": 1})
        assert tbl.size() == 1
        assert tbl.view().to_records() == [
            {"a": 3, "b": 4}
        ]
