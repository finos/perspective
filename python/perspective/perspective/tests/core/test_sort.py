#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

from pytest import raises
from perspective import PerspectiveError, PerspectiveViewer, PerspectiveWidget, Sort


class TestSort(object):
    def test_sort_widget_load(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data, sort=[["a", Sort.DESC]])
        assert widget.sort == [["a", "desc"]]

    def test_sort_widget_setattr(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        widget.sort = [["a", Sort.ASC_ABS]]
        assert widget.sort == [["a", "asc abs"]]

    def test_sort_widget_load_invalid(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        with raises(PerspectiveError):
            PerspectiveWidget(data, sort=[["a", "?"]])

    def test_sort_widget_setattr_invalid(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        with raises(PerspectiveError):
            widget.sort = [["a", "?"]]

    def test_sort_widget_init_all(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        for sort in Sort:
            widget = PerspectiveWidget(data, sort=[["a", sort]])
            assert widget.sort == [["a", sort.value]]

    def test_sort_widget_set_all(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        for sort in Sort:
            widget.sort = [["a", sort]]
            assert widget.sort == [["a", sort.value]]

    def test_sort_viewer_load(self):
        viewer = PerspectiveViewer(sort=[["a", Sort.COL_ASC_ABS]])
        assert viewer.sort == [["a", "col asc abs"]]

    def test_sort_viewer_setattr(self):
        viewer = PerspectiveViewer()
        viewer.sort = [["a", Sort.COL_DESC_ABS]]
        assert viewer.sort == [["a", "col desc abs"]]

    def test_sort_viewer_init_all(self):
        for sort in Sort:
            viewer = PerspectiveViewer(sort=[["a", sort]])
            assert viewer.sort == [["a", sort.value]]

    def test_sort_viewer_set_all(self):
        viewer = PerspectiveViewer()
        for sort in Sort:
            viewer.sort = [["a", sort]]
            assert viewer.sort == [["a", sort.value]]
