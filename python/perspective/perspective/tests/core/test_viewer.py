# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import numpy as np
import pandas as pd
from perspective import PerspectiveViewer, Table


class TestViewer:

    def test_viewer_get_table(self):
        table = Table({"a": [1, 2, 3]})
        viewer = PerspectiveViewer()
        viewer.load(table)
        assert viewer.table == table

    def test_viewer_load_table(self):
        table = Table({"a": [1, 2, 3]})
        viewer = PerspectiveViewer()
        viewer.load(table)
        assert viewer.columns == ["a"]

    def test_viewer_load_data(self):
        viewer = PerspectiveViewer()
        viewer.load({"a": [1, 2, 3]})
        assert viewer.columns == ["a"]

    def test_viewer_load_table_with_options(self):
        table = Table({"a": [1, 2, 3]})
        viewer = PerspectiveViewer()
        # options should be disregarded when loading Table
        viewer.load(table, limit=1)
        assert viewer.columns == ["a"]
        table_name = list(viewer.manager._tables.keys())[0]
        table = viewer.manager._tables[table_name]
        assert table.size() == 3

    def test_viewer_load_data_with_options(self):
        viewer = PerspectiveViewer()
        # options should be forwarded to the Table constructor
        viewer.load({"a": [1, 2, 3]}, limit=1)
        assert viewer.columns == ["a"]
        table_name = list(viewer.manager._tables.keys())[0]
        table = viewer.manager._tables[table_name]
        assert table.size() == 1

    def test_viewer_load_clears_state(self):
        table = Table({"a": [1, 2, 3]})
        viewer = PerspectiveViewer(dark=True, row_pivots=["a"])
        viewer.load(table)
        assert viewer.row_pivots == ["a"]
        viewer.load({"b": [1, 2, 3]})
        assert viewer.row_pivots == []
        assert viewer.dark is True  # should not break UI

    def test_viewer_load_np(self):
        table = Table({"a": np.arange(1, 100)})
        viewer = PerspectiveViewer()
        viewer.load(table)
        assert viewer.columns == ["a"]

    def test_viewer_update_dict(self):
        table = Table({"a": [1, 2, 3]})
        viewer = PerspectiveViewer()
        viewer.load(table)
        viewer.update({"a": [4, 5, 6]})
        assert table.size() == 6
        assert viewer.table.size() == 6
        assert viewer.table.view().to_dict() == {
            "a": [1, 2, 3, 4, 5, 6]
        }

    def test_viewer_update_list(self):
        table = Table({"a": [1, 2, 3]})
        viewer = PerspectiveViewer()
        viewer.load(table)
        viewer.update([{"a": 4}, {"a": 5}, {"a": 6}])
        assert table.size() == 6
        assert viewer.table.size() == 6
        assert viewer.table.view().to_dict() == {
            "a": [1, 2, 3, 4, 5, 6]
        }

    def test_viewer_update_df(self):
        table = Table({"a": [1, 2, 3]})
        viewer = PerspectiveViewer()
        viewer.load(table)
        viewer.update(pd.DataFrame({"a": [4, 5, 6]}))
        assert table.size() == 6
        assert viewer.table.size() == 6
        assert viewer.table.view().to_dict() == {
            "a": [1, 2, 3, 4, 5, 6]
        }

    def test_viewer_update_dict_partial(self):
        table = Table({"a": [1, 2, 3], "b": [5, 6, 7]}, index="a")
        viewer = PerspectiveViewer()
        viewer.load(table)
        viewer.update({"a": [1, 2, 3], "b": [8, 9, 10]})
        assert table.size() == 3
        assert viewer.table.size() == 3
        assert viewer.table.view().to_dict() == {
            "a": [1, 2, 3],
            "b": [8, 9, 10]
        }
