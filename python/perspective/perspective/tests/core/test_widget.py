# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import numpy as np
from perspective import PerspectiveWidget, Table


class TestWidget:

    def test_widget_load_table(self):
        table = Table({"a": [1, 2, 3]})
        widget = PerspectiveWidget()
        widget.load(table)
        assert widget.columns == ["a"]

    def test_widget_load_data(self):
        widget = PerspectiveWidget()
        widget.load({"a": [1, 2, 3]})
        assert widget.columns == ["a"]

    def test_widget_load_table_with_options(self):
        table = Table({"a": [1, 2, 3]})
        widget = PerspectiveWidget()
        # options should be disregarded when loading Table
        widget.load(table, limit=1)
        assert widget.columns == ["a"]
        table_name = list(widget.manager._tables.keys())[0]
        table = widget.manager._tables[table_name]
        assert table.size() == 3

    def test_widget_load_data_with_options(self):
        widget = PerspectiveWidget()
        # options should be forwarded to the Table constructor
        widget.load({"a": [1, 2, 3]}, limit=1)
        assert widget.columns == ["a"]
        table_name = list(widget.manager._tables.keys())[0]
        table = widget.manager._tables[table_name]
        assert table.size() == 1

    def test_widget_load_clears_state(self):
        table = Table({"a": [1, 2, 3]})
        widget = PerspectiveWidget(dark=True, row_pivots=["a"])
        widget.load(table)
        assert widget.row_pivots == ["a"]
        widget.load({"b": [1, 2, 3]})
        assert widget.row_pivots == []
        assert widget.dark is True  # should not break UI

    def test_widget_load_np(self):
        table = Table({"a": np.arange(1, 100)})
        widget = PerspectiveWidget()
        widget.load(table)
        assert widget.columns == ["a"]
