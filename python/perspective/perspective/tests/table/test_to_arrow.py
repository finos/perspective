################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import pyarrow as pa
from datetime import date, datetime
from perspective import Table


class TestToArrow(object):

    def test_to_arrow_nones_symmetric(self):
        data = {
            "a": [None, 1, None, 2, 3],
            "b": [1.5, 2.5, None, 3.5, None]
        }
        tbl = Table(data)
        assert tbl.schema() == {
            "a": int,
            "b": float
        }
        arr = tbl.view().to_arrow()
        tbl2 = Table(arr)
        assert tbl2.view().to_dict() == data

    def test_to_arrow_big_numbers_symmetric(self):
        data = {
            "a": [1, 2, 3, 4],
            "b": [1.7976931348623157e+308, 1.7976931348623157e+308, 1.7976931348623157e+308, 1.7976931348623157e+308]
        }
        tbl = Table(data)
        assert tbl.schema() == {
            "a": int,
            "b": float
        }
        arr = tbl.view().to_arrow()
        tbl2 = Table(arr)
        assert tbl2.view().to_dict() == data

    def test_to_arrow_boolean_symmetric(self):
        data = {
            "a": [True, False, None, False, True, None]
        }
        tbl = Table(data)
        assert tbl.schema() == {
            "a": bool
        }
        arr = tbl.view().to_arrow()
        tbl2 = Table(arr)
        assert tbl2.view().to_dict() == data

    def test_to_arrow_date_symmetric(self):
        data = {
            "a": [date(2019, 7, 11), date(2016, 2, 29), date(2019, 12, 10)]
        }
        tbl = Table(data)
        assert tbl.schema() == {
            "a": date
        }
        arr = tbl.view().to_arrow()
        tbl2 = Table(arr)
        assert tbl2.schema() == tbl.schema()
        assert tbl2.view().to_dict() == {
            "a": [datetime(2019, 7, 11), datetime(2016, 2, 29), datetime(2019, 12, 10)]
        }

    def test_to_arrow_datetime_symmetric(self):
        data = {
            "a": [datetime(2019, 7, 11, 12, 30), datetime(2016, 2, 29, 11, 0), datetime(2019, 12, 10, 12, 0)]
        }
        tbl = Table(data)
        assert tbl.schema() == {
            "a": datetime
        }
        arr = tbl.view().to_arrow()
        tbl2 = Table(arr)
        assert tbl2.schema() == tbl.schema()
        assert tbl2.view().to_dict() == {
            "a": [datetime(2019, 7, 11, 12, 30), datetime(2016, 2, 29, 11, 0), datetime(2019, 12, 10, 12, 0)]
        }