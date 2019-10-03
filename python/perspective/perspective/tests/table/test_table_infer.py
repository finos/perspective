# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table import Table
from datetime import date, datetime


class TestTableInfer(object):

    def test_table_infer_int(self):
        data = {"a": [None, None, None, None, 1, 0, 1, 1, 1]}
        tbl = Table(data)
        assert tbl.schema() == {"a": int}

    def test_table_infer_float(self):
        data = {"a": [None, None, None, None, 1.0, 2.0]}
        tbl = Table(data)
        assert tbl.schema() == {"a": float}

    def test_table_promote_float(self):
        data = {"a": [1, 2, 3, 4, 2147483648]}
        tbl = Table(data)
        assert tbl.schema() == {"a": float}
        assert tbl.view().to_dict() == {"a": [1.0, 2.0, 3.0, 4.0, 2147483648.0]}

    def test_table_infer_bool(self):
        data = {"a": [None, None, None, None, True, True, True]}
        tbl = Table(data)
        assert tbl.schema() == {"a": bool}

    def test_table_infer_str(self):
        data = {"a": [None, None, None, None, None, None, "abc"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}

    def test_table_infer_date_from_datetime(self):
        data = {"a": [None, None, None, None, None, None, datetime(2019, 7, 11)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": datetime}

    def test_table_infer_valid_date(self):
        data = {"a": [None, None, None, None, None, None, "08/31/2019"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": date}

    def test_table_infer_ambiguous_date(self):
        data = {"a": [None, None, None, None, None, None, "01/03/2019"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": date}

    def test_table_infer_ymd_date(self):
        data = {"a": [None, None, None, None, None, None, "2019/01/03"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": date}

    def test_table_infer_invalid_date(self):
        data = {"a": [None, None, None, None, None, None, "08/55/2019"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}

    def test_table_infer_date_edge(self):
        data = {"a": [None, None, None, None, None, None, "08/31/2019 00:00:00"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": date}

    def test_table_infer_datetime_edge(self):
        data = {"a": [None, None, None, None, None, None, "08/31/2019 00:00:01"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": datetime}

    def test_table_infer_valid_datetime(self):
        data = {"a": [None, None, None, None, None, None, "08/31/2019 07:30:00"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": datetime}

    def test_table_infer_iso_datetime(self):
        data = {"a": [None, None, None, None, None, None, "2019/07/25T09:00:00"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": datetime}

    def test_table_infer_datetime_separators(self):
        data = {"a": [None, None, None, None, None, "2019-07-25T09:00:00", "2019/07/25T09:00:00"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": datetime}

    def test_table_infer_datetime_tz(self):
        data = {"a": [None, None, None, None, None, "2019-07-25T09:00:00-05:00"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": datetime}

    def test_table_infer_invalid_datetime(self):
        data = {"a": [None, None, None, None, None, None, "08/31/2019 25:30:00"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}

    def test_table_infer_mixed_date(self):
        data = {"a": [None, None, None, None, None, "08/11/2019"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": date}

    def test_table_infer_mixed_datetime(self):
        data = {"a": [None, None, None, None, None, "08/11/2019 13:14:15"]}
        tbl = Table(data)
        assert tbl.schema() == {"a": datetime}

    def test_table_strict_datetime_infer(self):
        data = {"a": ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1']}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}
