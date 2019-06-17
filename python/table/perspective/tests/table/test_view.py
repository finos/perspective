# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table import Table


class TestView(object):
    def test_view_zero(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.num_rows() == 2
        assert view.num_columns() == 2
        assert view.schema() == {
            "a": "integer",
            "b": "integer"
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
            "a": "integer",
            "b": "integer"
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
            "a": "integer",
            "b": "integer"
        }

    # schema correctness

    def test_zero_view_schema(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.schema() == {
            "a": "integer",
            "b": "integer"
        }

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
