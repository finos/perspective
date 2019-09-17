# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table.libbinding import t_filter_op
from perspective.table import Table
from datetime import date, datetime


class TestView(object):
    def test_view_zero(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.num_rows() == 2
        assert view.num_columns() == 2
        assert view.schema() == {
            "a": int,
            "b": int
        }

    def test_view_one(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({
            "row_pivots": ["a"]
        })
        assert view.num_rows() == 2
        assert view.num_columns() == 2
        assert view.schema() == {
            "a": int,
            "b": int
        }

    def test_view_two(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({
            "row_pivots": ["a"],
            "column_pivots": ["b"]
        })
        assert view.num_rows() == 2
        assert view.num_columns() == 2
        assert view.schema() == {
            "a": int,
            "b": int
        }

    def test_view_two_column_only(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({
            "column_pivots": ["b"]
        })
        assert view.num_rows() == 2
        assert view.num_columns() == 2
        assert view.schema() == {
            "a": int,
            "b": int
        }

    # schema correctness

    def test_string_view_schema(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.schema(True) == {
            "a": "integer",
            "b": "integer"
        }

    def test_zero_view_schema(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.schema() == {
            "a": int,
            "b": int
        }

    def test_one_view_schema(self):
        data = [{"a": "abc", "b": 2}, {"a": "abc", "b": 4}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"],
            "aggregates": {
                "a": "distinct count"
            }
        })
        assert view.schema() == {
            "a": int,
            "b": int
        }

    def test_two_view_schema(self):
        data = [{"a": "abc", "b": "def"}, {"a": "abc", "b": "def"}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"],
            "column-pivots": ["b"],
            "aggregates": {
                "a": "count",
                "b": "count"
            }
        })
        assert view.schema() == {
            "a": int,
            "b": int
        }

    # aggregates and column specification

    def test_view_no_columns(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"columns": []})
        assert view.num_columns() == 0
        assert view.to_records() == [{}, {}]

    def test_view_specific_column(self):
        data = [{"a": 1, "b": 2, "c": 3, "d": 4}, {"a": 3, "b": 4, "c": 5, "d": 6}]
        tbl = Table(data)
        view = tbl.view({"columns": ["a", "c", "d"]})
        assert view.num_columns() == 3
        assert view.to_records() == [{"a": 1, "c": 3, "d": 4}, {"a": 3, "c": 5, "d": 6}]

    def test_view_column_order(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"columns": ["b", "a"]})
        assert view.to_records() == [{"b": 2, "a": 1}, {"b": 4, "a": 3}]

    # aggregate

    def test_view_aggregate_int(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({
            "aggregates": {"a": "avg"},
            "row-pivots": ["a"]
        })
        assert view.to_records() == [
            {"__ROW_PATH__": [], "a": 2.0, "b": 6},
            {"__ROW_PATH__": ["1"], "a": 1.0, "b": 2},
            {"__ROW_PATH__": ["3"], "a": 3.0, "b": 4}
        ]

    def test_view_aggregate_str(self):
        data = [{"a": "abc", "b": 2}, {"a": "def", "b": 4}]
        tbl = Table(data)
        view = tbl.view({
            "aggregates": {"a": "count"},
            "row-pivots": ["a"]
        })
        assert view.to_records() == [
            {"__ROW_PATH__": [], "a": 2, "b": 6},
            {"__ROW_PATH__": ["abc"], "a": 1, "b": 2},
            {"__ROW_PATH__": ["def"], "a": 1, "b": 4}
        ]

    # sort

    def test_view_sort_int(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"sort": [["a", "desc"]]})
        assert view.to_records() == [{"a": 3, "b": 4}, {"a": 1, "b": 2}]

    def test_view_sort_float(self):
        data = [{"a": 1.1, "b": 2}, {"a": 1.2, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"sort": [["a", "desc"]]})
        assert view.to_records() == [{"a": 1.2, "b": 4}, {"a": 1.1, "b": 2}]

    def test_view_sort_string(self):
        data = [{"a": "abc", "b": 2}, {"a": "def", "b": 4}]
        tbl = Table(data)
        view = tbl.view({"sort": [["a", "desc"]]})
        assert view.to_records() == [{"a": "def", "b": 4}, {"a": "abc", "b": 2}]

    def test_view_sort_date(self):
        data = [{"a": date(2019, 7, 11), "b": 2}, {"a": date(2019, 7, 12), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"sort": [["a", "desc"]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 12), "b": 4}, {"a": datetime(2019, 7, 11), "b": 2}]

    def test_view_sort_datetime(self):
        data = [{"a": datetime(2019, 7, 11, 8, 15), "b": 2}, {"a": datetime(2019, 7, 11, 8, 16), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"sort": [["a", "desc"]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 11, 8, 16), "b": 4}, {"a": datetime(2019, 7, 11, 8, 15), "b": 2}]

    # filter

    def test_view_filter_int_eq(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "==", 1]]})
        assert view.to_records() == [{"a": 1, "b": 2}]

    def test_view_filter_int_neq(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "!=", 1]]})
        assert view.to_records() == [{"a": 3, "b": 4}]

    def test_view_filter_int_gt(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", ">", 1]]})
        assert view.to_records() == [{"a": 3, "b": 4}]

    def test_view_filter_int_lt(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "<", 3]]})
        assert view.to_records() == [{"a": 1, "b": 2}]

    def test_view_filter_float_eq(self):
        data = [{"a": 1.1, "b": 2}, {"a": 1.2, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "==", 1.2]]})
        assert view.to_records() == [{"a": 1.2, "b": 4}]

    def test_view_filter_float_neq(self):
        data = [{"a": 1.1, "b": 2}, {"a": 1.2, "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "!=", 1.2]]})
        assert view.to_records() == [{"a": 1.1, "b": 2}]

    def test_view_filter_string_eq(self):
        data = [{"a": "abc", "b": 2}, {"a": "def", "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "==", "def"]]})
        assert view.to_records() == [{"a": "def", "b": 4}]

    def test_view_filter_string_neq(self):
        data = [{"a": "abc", "b": 2}, {"a": "def", "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "!=", "def"]]})
        assert view.to_records() == [{"a": "abc", "b": 2}]

    def test_view_filter_string_gt(self):
        data = [{"a": "abc", "b": 2}, {"a": "def", "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", ">", "abc"]]})
        assert view.to_records() == [{"a": "def", "b": 4}]

    def test_view_filter_string_lt(self):
        data = [{"a": "abc", "b": 2}, {"a": "def", "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "<", "def"]]})
        assert view.to_records() == [{"a": "abc", "b": 2}]

    def test_view_filter_date_eq(self):
        data = [{"a": date(2019, 7, 11), "b": 2}, {"a": date(2019, 7, 12), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "==", date(2019, 7, 12)]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 12), "b": 4}]

    def test_view_filter_date_neq(self):
        data = [{"a": date(2019, 7, 11), "b": 2}, {"a": date(2019, 7, 12), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "!=", date(2019, 7, 12)]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 11), "b": 2}]

    def test_view_filter_date_str_eq(self):
        data = [{"a": date(2019, 7, 11), "b": 2}, {"a": date(2019, 7, 12), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "==", "2019/7/12"]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 12), "b": 4}]

    def test_view_filter_date_str_neq(self):
        data = [{"a": date(2019, 7, 11), "b": 2}, {"a": date(2019, 7, 12), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "!=", "2019/7/12"]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 11), "b": 2}]

    def test_view_filter_datetime_eq(self):
        data = [{"a": datetime(2019, 7, 11, 8, 15), "b": 2}, {"a": datetime(2019, 7, 11, 8, 16), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "==", datetime(2019, 7, 11, 8, 15)]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 11, 8, 15), "b": 2}]

    def test_view_filter_datetime_neq(self):
        data = [{"a": datetime(2019, 7, 11, 8, 15), "b": 2}, {"a": datetime(2019, 7, 11, 8, 16), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "!=", datetime(2019, 7, 11, 8, 15)]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 11, 8, 16), "b": 4}]

    def test_view_filter_datetime_str_eq(self):
        data = [{"a": datetime(2019, 7, 11, 8, 15), "b": 2}, {"a": datetime(2019, 7, 11, 8, 16), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "==", "2019/7/11 8:15"]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 11, 8, 15), "b": 2}]

    def test_view_filter_datetime_str_neq(self):
        data = [{"a": datetime(2019, 7, 11, 8, 15), "b": 2}, {"a": datetime(2019, 7, 11, 8, 16), "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "!=", "2019/7/11 8:15"]]})
        assert view.to_records() == [{"a": datetime(2019, 7, 11, 8, 16), "b": 4}]

    def test_view_filter_string_is_none(self):
        data = [{"a": None, "b": 2}, {"a": "abc", "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "is null"]]})
        assert view.to_records() == [{"a": None, "b": 2}]

    def test_view_filter_string_is_not_none(self):
        data = [{"a": None, "b": 2}, {"a": "abc", "b": 4}]
        tbl = Table(data)
        view = tbl.view({"filter": [["a", "is not null"]]})
        assert view.to_records() == [{"a": "abc", "b": 4}]

    # pivot depth
    """
    def test_row_pivot_depth(self):
       data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
       tbl = Table(data)
       view = tbl.view({
           "row-pivots": ["a", "b"],
           "row_pivot_depth": 1
       })
       assert view.to_records() == [{"__ROW_PATH__": [], "a": 4, "b": 6}, {"__ROW_PATH__": ["2", "1"], "a": 1, "b": 2}, {"__ROW_PATH__": ["4", "3"], "a": 3, "b": 4}]
       """

    # is_valid_filter
    def test_view_is_valid_filter_str(self):
        filter = ["a", "<", 1]
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.is_valid_filter(filter) == True

    def test_view_not_is_valid_filter_str(self):
        filter = ["a", "<", None]
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.is_valid_filter(filter) == False

    def test_view_is_valid_filter_filter_op(self):
        filter = ["a", t_filter_op.FILTER_OP_IS_NULL]
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.is_valid_filter(filter) == True

    def test_view_not_is_valid_filter_filter_op(self):
        filter = ["a", t_filter_op.FILTER_OP_GT, None]
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.is_valid_filter(filter) == False

    def test_view_is_valid_filter_date(self):
        filter = ["a", t_filter_op.FILTER_OP_GT, date.today()]
        tbl = Table({
            "a": date
        })
        view = tbl.view()
        assert view.is_valid_filter(filter) == True

    def test_view_not_is_valid_filter_date(self):
        filter = ["a", t_filter_op.FILTER_OP_GT, None]
        tbl = Table({
            "a": date
        })
        view = tbl.view()
        assert view.is_valid_filter(filter) == False

    def test_view_is_valid_filter_datetime(self):
        filter = ["a", t_filter_op.FILTER_OP_GT, datetime.now()]
        tbl = Table({
            "a": datetime
        })
        view = tbl.view()
        assert view.is_valid_filter(filter) == True

    def test_view_not_is_valid_filter_datetime(self):
        filter = ["a", t_filter_op.FILTER_OP_GT, None]
        tbl = Table({
            "a": datetime
        })
        view = tbl.view()
        assert view.is_valid_filter(filter) == False

    # on_update
    def test_view_on_update(self):
        sentinel = False

        def callback():
            nonlocal sentinel
            sentinel = True

        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        view.on_update(callback)
        tbl.update(data)
        assert sentinel == True

    # on_delete

    def test_view_on_delete(self):
        sentinel = False

        def callback():
            nonlocal sentinel
            sentinel = True

        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        view.on_delete(callback)
        view.delete()
        assert sentinel == True

    # delete

    def test_view_delete(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        view.delete()
        # don't segfault

    def test_view_delete_multiple_callbacks(self):
        # make sure that callbacks on views get filtered
        sentinel = 0

        def cb1():
            nonlocal sentinel
            sentinel += 1

        def cb2():
            nonlocal sentinel
            sentinel += 2
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        v1 = tbl.view()
        v2 = tbl.view()
        v1.on_update(cb1)
        v2.on_update(cb2)
        v1.delete()
        assert len(tbl._views) == 1
        tbl.update(data)
        assert sentinel == 2

    def test_view_delete_full_cleanup(self):
        sentinel = 0

        def cb1():
            nonlocal sentinel
            sentinel += 1

        def cb2():
            nonlocal sentinel
            sentinel += 2
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        v1 = tbl.view()
        v2 = tbl.view()
        v1.on_update(cb1)
        v2.on_update(cb2)
        v1.delete()
        v2.delete()
        tbl.update(data)
        assert sentinel == 0

    # remove_update

    def test_view_remove_update(self):
        sentinel = 0

        def cb1():
            nonlocal sentinel
            sentinel += 1

        def cb2():
            nonlocal sentinel
            sentinel += 2
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        view.on_update(cb1)
        view.on_update(cb2)
        view.remove_update(cb1)
        tbl.update(data)
        assert sentinel == 2

    def test_view_remove_multiple_update(self):
        sentinel = 0

        def cb1():
            nonlocal sentinel
            sentinel += 1

        def cb2():
            nonlocal sentinel
            sentinel += 2
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        view.on_update(cb1)
        view.on_update(cb2)
        view.on_update(cb1)
        view.remove_update(cb1)
        assert len(view._callbacks.get_callbacks()) == 1
        tbl.update(data)
        assert sentinel == 2
