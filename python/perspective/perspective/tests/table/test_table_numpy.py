# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import numpy as np
from pytest import raises
from perspective import PerspectiveError
from perspective.table import Table
from datetime import date, datetime


class TestTableNumpy(object):
    def test_empty_table(self):
        tbl = Table([])
        assert tbl.size() == 0

    def test_table_int(self):
        data = {"a": np.array([1, 2, 3]), "b": np.array([4, 5, 6])}
        tbl = Table(data)
        assert tbl.size() == 3

    def test_table_int8(self):
        data = {"a": np.array([1, 2, 3]).astype(np.int8), "b": np.array([4, 5, 6]).astype(np.int8)}
        tbl = Table(data)
        assert tbl.size() == 3

    def test_table_int16(self):
        data = {"a": np.array([1, 2, 3]).astype(np.int16), "b": np.array([4, 5, 6]).astype(np.int16)}
        tbl = Table(data)
        assert tbl.size() == 3

    def test_table_int32(self):
        data = {"a": np.array([1, 2, 3]).astype(np.int32), "b": np.array([4, 5, 6]).astype(np.int32)}
        tbl = Table(data)
        assert tbl.size() == 3

    def test_table_int64(self):
        data = {"a": np.array([1, 2, 3]).astype(np.int64), "b": np.array([4, 5, 6]).astype(np.int64)}
        tbl = Table(data)
        assert tbl.size() == 3

    def test_table_float(self):
        data = {"a": np.array([1.1, 2.2]), "b": np.array([3.3, 4.4])}
        tbl = Table(data)
        assert tbl.size() == 2

    def test_table_float32(self):
        data = {"a": np.array([1.1, 2.2]).astype(np.float32), "b": np.array([3.3, 4.4]).astype(np.float32)}
        tbl = Table(data)
        assert tbl.size() == 2

    def test_table_float64(self):
        data = {"a": np.array([1.1, 2.2]).astype(np.float64), "b": np.array([3.3, 4.4]).astype(np.float64)}
        tbl = Table(data)
        assert tbl.size() == 2

    def test_table_bool(self):
        data = {"a": np.array([True, False]), "b": np.array([False, True])}
        tbl = Table(data)
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {
            "a": [True, False],
            "b": [False, True]
        }

    def test_table_bool8(self):
        data = {"a": np.array([True, False]).astype(np.bool8), "b": np.array([False, True]).astype(np.bool8)}
        tbl = Table(data)
        assert tbl.size() == 2

    def test_table_date(self):
        data = {"a": np.array([date.today()]), "b": np.array([date.today()])}
        tbl = Table(data)
        assert tbl.size() == 1
        assert tbl.schema() == {
            "a": date,
            "b": date
        }

    def test_table_np_datetime(self):
        data = {"a": np.array([datetime(2019, 7, 11, 12, 13)], dtype=np.datetime64), "b": np.array([datetime(2019, 7, 11, 12, 14)], dtype=np.datetime64)}
        tbl = Table(data)
        assert tbl.size() == 1
        assert tbl.schema() == {
            "a": datetime,
            "b": datetime
        }
        assert tbl.view().to_numpy() == data

    def test_table_np_datetime_mixed_dtype(self):
        data = {"a": np.array([datetime(2019, 7, 11, 12, 13)], dtype=np.datetime64), "b": np.array([datetime(2019, 7, 11, 12, 14)], dtype=object)}
        tbl = Table(data)
        assert tbl.size() == 1
        assert tbl.schema() == {
            "a": datetime,
            "b": datetime
        }
        assert tbl.view().to_numpy() == data

    def test_table_np_datetime_default(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype=np.datetime64)
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 12, 11, 0)]
        }

    def test_table_np_datetime_string_dtype(self):
        tbl = Table({
            "a": np.array(["2019/07/11 15:30:05", "2019/07/11 15:30:05"])
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 11, 15, 30, 5), datetime(2019, 7, 11, 15, 30, 5)]
        }

    def test_table_np_datetime_ns(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[ns]")
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 12, 11, 0)]
        }

    def test_table_np_datetime_us(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[us]")
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 12, 11, 0)]
        }

    def test_table_np_datetime_ms(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[ms]")
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 12, 11, 0)]
        }

    def test_table_np_datetime_s(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[s]")
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 12, 11, 0)]
        }

    def test_table_np_timedelta(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[ns]") - np.array([datetime(2019, 7, 1, 11, 0)], dtype="datetime64[ns]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": ["950400000000000 nanoseconds"]
        }

    def test_table_np_timedelta_us(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[us]") - np.array([datetime(2019, 7, 1, 11, 0)], dtype="datetime64[us]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": ["950400000000 microseconds"]
        }

    def test_table_np_timedelta_ms(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[ms]") - np.array([datetime(2019, 7, 1, 11, 0)], dtype="datetime64[ms]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": ["950400000 milliseconds"]
        }

    def test_table_np_timedelta_s(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[s]") - np.array([datetime(2019, 7, 1, 11, 0)], dtype="datetime64[s]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": ["950400 seconds"]
        }

    def test_table_np_timedelta_m(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[m]") - np.array([datetime(2019, 7, 1, 11, 0)], dtype="datetime64[m]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": ["15840 minutes"]
        }

    def test_table_np_timedelta_h(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[h]") - np.array([datetime(2019, 7, 1, 11, 0)], dtype="datetime64[h]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": ["264 hours"]
        }

    def test_table_np_timedelta_d(self):
        tbl = Table({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype="datetime64[D]") - np.array([datetime(2019, 7, 1, 11, 0)], dtype="datetime64[D]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": ["11 days"]
        }

    def test_table_np_timedelta_with_none(self):
        tbl = Table({
            "a": np.array([None, datetime(2019, 7, 12, 11, 0)], dtype="datetime64[ns]") - np.array([datetime(2019, 7, 1, 11, 0), None], dtype="datetime64[ns]")
        })

        assert tbl.schema() == {
            "a": str
        }

        assert tbl.view().to_dict() == {
            "a": [None, None]  # two `NaT` values
        }

    def test_table_np_mixed(self):
        data = {
            "a": np.arange(5),
            "b": np.full(5, np.nan),
            "c": ["a", "b", "c", "d", "e"]
        }

        # should not be able to parse mixed dicts of numpy array with list
        with raises(PerspectiveError):
            Table(data)

    def test_table_np_promote(self):
        data = {
            "a": np.arange(5),
            "b": np.full(5, np.nan),
            "c": np.array([1, 2, 3, 2147483648, 5])
        }
        tbl = Table({
            "a": int,
            "b": float,
            "c": int
        })
        tbl.update(data)
        assert tbl.size() == 5
        assert tbl.schema() == {
            "a": int,
            "b": float,
            "c": int
        }

        assert tbl.view().to_dict() == {
            "a": [0, 1, 2, 3, 4],
            "b": [None, None, None, None, None],
            "c": [1.0, 2.0, 3.0, 2147483648.0, 5.0]
        }

    def test_table_np_promote_to_string(self):
        data = {
            "a": np.arange(4),
            "b": np.array([1, 2, "abc", "abc"]),
        }
        tbl = Table(data)
        assert tbl.size() == 4
        assert tbl.schema() == {
            "a": int,
            "b": str,
        }

        assert tbl.view().to_dict() == {
            "a": [0, 1, 2, 3],
            "b": ["1", "2", "abc", "abc"],
        }

    def test_table_np_implicit_index(self):
        data = {
            "a": np.array(["a", "b", "c", "d", "e"]),
            "b": np.array([1, 2, 3, 4, 5])
        }
        tbl = Table(data)
        assert tbl.size() == 5
        assert tbl.schema() == {
            "a": str,
            "b": int
        }
        tbl.update({
            "__INDEX__": np.array([1, 2, 3, 4]),
            "a": np.array(["bb", "cc", "dd", "ee"])
        })

        assert tbl.view().to_dict() == {
            "a": ["a", "bb", "cc", "dd", "ee"],
            "b": [1, 2, 3, 4, 5]
        }

    def test_table_recarray(self):
        d = np.array([(1.0, 2), (3.0, 4)], dtype=[('x', '<f8'), ('y', '<i8')]).view(np.recarray)
        table = Table(d)
        assert table.schema() == {
            "x": float,
            "y": int
        }
        assert table.view().to_dict() == {
            "x": [1.0, 3.0],
            "y": [2, 4]
        }

    def test_table_recarray_str(self):
        table = Table(np.array([("string1", "string2"), ("string3", "string4")], dtype=[('x', 'O'), ('y', 'O')]).view(np.recarray))
        assert table.schema() == {
            "x": str,
            "y": str
        }
        assert table.view().to_dict() == {
            "x": ["string1", "string3"],
            "y": ["string2", "string4"]
        }
