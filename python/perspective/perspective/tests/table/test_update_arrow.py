# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import pyarrow as pa
from datetime import date, datetime
from pytest import mark
from perspective.table import Table


names = ["a", "b", "c", "d"]


class TestUpdateArrow(object):

    def test_update_arrow_updates_int_stream(self, util):
        data = [list(range(10)) for i in range(4)]
        arrow_data = util.make_arrow(names, data)
        tbl = Table({
            "a": int,
            "b": int,
            "c": int,
            "d": int
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": data[0],
            "b": data[1],
            "c": data[2],
            "d": data[3]
        }

    def test_update_arrow_updates_float_stream(self, util):
        data = [
            [i for i in range(10)],
            [i * 1.5 for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a", "b"], data)
        tbl = Table({
            "a": int,
            "b": float,
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": data[0],
            "b": data[1]
        }

    def test_update_arrow_updates_decimal_stream(self, util):
        data = [
            [i * 1000 for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a"], data, types=[pa.decimal128(4)])
        tbl = Table({
            "a": int,
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": data[0]
        }

    def test_update_arrow_updates_bool_stream(self, util):
        data = [
            [True if i % 2 == 0 else False for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a"], data)
        tbl = Table({
            "a": bool
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": data[0]
        }

    def test_update_arrow_updates_date32_stream(self, util):
        data = [
            [date(2019, 2, i) for i in range(1, 11)]
        ]
        arrow_data = util.make_arrow(["a"], data, types=[pa.date32()])
        tbl = Table({
            "a": date
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 2, i) for i in range(1, 11)]
        }

    def test_update_arrow_updates_date64_stream(self, util):
        data = [
            [date(2019, 2, i) for i in range(1, 11)]
        ]
        arrow_data = util.make_arrow(["a"], data, types=[pa.date64()])
        tbl = Table({
            "a": date
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 2, i) for i in range(1, 11)]
        }

    def test_update_arrow_updates_timestamp_all_formats_stream(self, util):
        data = [
            [datetime(2019, 2, i, 9) for i in range(1, 11)],
            [datetime(2019, 2, i, 10) for i in range(1, 11)],
            [datetime(2019, 2, i, 11) for i in range(1, 11)],
            [datetime(2019, 2, i, 12) for i in range(1, 11)]
        ]
        arrow_data = util.make_arrow(
            names, data, types=[
                pa.timestamp("s"),
                pa.timestamp("ms"),
                pa.timestamp("us"),
                pa.timestamp("ns"),
            ]
        )
        tbl = Table({
            "a": datetime,
            "b": datetime,
            "c": datetime,
            "d": datetime
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": data[0],
            "b": data[1],
            "c": data[2],
            "d": data[3]
        }

    def test_update_arrow_updates_string_stream(self, util):
        data = [
            [str(i) for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a"], data, types=[pa.string()])
        tbl = Table({
            "a": str
        })
        tbl.update(arrow_data)
        assert tbl.size() == 10
        assert tbl.view().to_dict() == {
            "a": data[0]
        }

    @mark.skip
    def test_update_arrow_updates_dictionary_stream(self, util):
        data = [
            ([0, 1, 1, None], ["a", "b"]),
            ([0, 1, None, 2], ["x", "y", "z"])
        ]
        arrow_data = util.make_dictionary_arrow(["a", "b"], data)
        tbl = Table({
            "a": str,
            "b": str
        })
        tbl.update(arrow_data)

        assert tbl.size() == 4
        assert tbl.view().to_dict() == {
            "a": ["a", "b", "b", None],
            "b": ["x", "y", None, "z"]
        }

    # append

    def test_update_arrow_updates_append_int_stream(self, util):
        data = [list(range(10)) for i in range(4)]
        arrow_data = util.make_arrow(names, data)
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": data[0] + data[0],
            "b": data[1] + data[1],
            "c": data[2] + data[2],
            "d": data[3] + data[3]
        }

    def test_update_arrow_updates_append_float_stream(self, util):
        data = [
            [i for i in range(10)],
            [i * 1.5 for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a", "b"], data)
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": data[0] + data[0],
            "b": data[1] + data[1]
        }

    def test_update_arrow_updates_append_decimal_stream(self, util):
        data = [
            [i * 1000 for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a"], data, types=[pa.decimal128(4)])
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": data[0] + data[0]
        }

    def test_update_arrow_updates_append_bool_stream(self, util):
        data = [
            [True if i % 2 == 0 else False for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a"], data)
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": data[0] + data[0]
        }

    def test_update_arrow_updates_append_date32_stream(self, util):
        data = [
            [date(2019, 2, i) for i in range(1, 11)]
        ]
        out_data = [datetime(2019, 2, i) for i in range(1, 11)]
        arrow_data = util.make_arrow(["a"], data, types=[pa.date32()])
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": out_data + out_data
        }

    def test_update_arrow_updates_append_date64_stream(self, util):
        data = [
            [date(2019, 2, i) for i in range(1, 11)]
        ]
        out_data = [datetime(2019, 2, i) for i in range(1, 11)]
        arrow_data = util.make_arrow(["a"], data, types=[pa.date64()])
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": out_data + out_data
        }

    def test_update_arrow_updates_append_timestamp_all_formats_stream(self, util):
        data = [
            [datetime(2019, 2, i, 9) for i in range(1, 11)],
            [datetime(2019, 2, i, 10) for i in range(1, 11)],
            [datetime(2019, 2, i, 11) for i in range(1, 11)],
            [datetime(2019, 2, i, 12) for i in range(1, 11)]
        ]
        arrow_data = util.make_arrow(
            names, data, types=[
                pa.timestamp("s"),
                pa.timestamp("ms"),
                pa.timestamp("us"),
                pa.timestamp("ns"),
            ]
        )
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": data[0] + data[0],
            "b": data[1] + data[1],
            "c": data[2] + data[2],
            "d": data[3] + data[3],
        }

    def test_update_arrow_updates_append_string_stream(self, util):
        data = [
            [str(i) for i in range(10)]
        ]
        arrow_data = util.make_arrow(["a"], data, types=[pa.string()])
        tbl = Table(arrow_data)
        tbl.update(arrow_data)
        assert tbl.size() == 20
        assert tbl.view().to_dict() == {
            "a": data[0] + data[0]
        }

    @mark.skip
    def test_update_arrow_updates_append_dictionary_stream(self, util):
        data = [
            ([0, 1, 1, None], ["a", "b"]),
            ([0, 1, None, 2], ["x", "y", "z"])
        ]
        arrow_data = util.make_dictionary_arrow(["a", "b"], data)
        tbl = Table(arrow_data)
        tbl.update(arrow_data)

        assert tbl.size() == 8
        assert tbl.view().to_dict() == {
            "a": ["a", "b", "b", None, "a", "b", "b", None],
            "b": ["x", "y", None, "z", "x", "y", None, "z"]
        }

    # indexed

    def test_update_arrow_partial_indexed(self, util):
        data = [[1, 2, 3, 4], ["a", "b", "c", "d"]]
        update_data = [[2, 4], ["x", "y"]]
        arrow = util.make_arrow(["a", "b"], data)
        update_arrow = util.make_arrow(["a", "b"], update_data)
        tbl = Table(arrow, index="a")
        assert tbl.schema() == {
            "a": int,
            "b": str
        }
        tbl.update(update_arrow)
        assert tbl.size() == 4
        assert tbl.view().to_dict() == {
            "a": [1, 2, 3, 4],
            "b": ["a", "x", "c", "y"]
        }
