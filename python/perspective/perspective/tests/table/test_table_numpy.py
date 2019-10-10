# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import numpy as np
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

    def test_table_datetime(self):
        data = {"a": np.array([datetime.now()]), "b": np.array([datetime.now()])}
        tbl = Table(data)
        assert tbl.size() == 1
        assert tbl.schema() == {
            "a": datetime,
            "b": datetime
        }

    def test_table_np_mixed(self):
        data = {
            "a": np.arange(5),
            "b": np.full(5, np.nan),
            "c": ["a", "b", "c", "d", "e"]
        }
        tbl = Table(data)
        assert tbl.size() == 5
        assert tbl.schema() == {
            "a": int,
            "b": float,
            "c": str
        }
