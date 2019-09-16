# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table.libbinding import make_table, t_op, make_view_zero, make_view_one, make_view_two
from perspective.table.view_config import ViewConfig
from perspective.table._accessor import _PerspectiveAccessor


class TestMakeView(object):
    def test_make_view_zero(self):
        accessor = _PerspectiveAccessor([{"a": 1, "b": 2}, {"a": 3, "b": 4}])
        view_config = ViewConfig({})
        tbl = make_table(None, accessor, None, 4294967295, '', t_op.OP_INSERT, False, False)
        view = make_view_zero(tbl, "view0", "|", view_config, accessor._date_validator)
        assert view.num_rows() == 2

    def test_make_view_one(self):
        accessor = _PerspectiveAccessor([{"a": 1, "b": 2}, {"a": 3, "b": 4}])
        view_config = ViewConfig({
            "row_pivots": ["a"]
        })
        tbl = make_table(None, accessor, None, 4294967295, '', t_op.OP_INSERT, False, False)
        view = make_view_one(tbl, "view1", "|", view_config, accessor._date_validator)
        assert view.num_rows() == 1

    def test_make_view_two(self):
        accessor = _PerspectiveAccessor([{"a": 1, "b": 2}, {"a": 3, "b": 4}])
        view_config = ViewConfig({
            "row_pivots": ["a"],
            "column_pivots": ["b"]
        })
        tbl = make_table(None, accessor, None, 4294967295, '', t_op.OP_INSERT, False, False)
        view = make_view_two(tbl, "view2", "|", view_config, accessor._date_validator)
        assert view.num_rows() == 1
