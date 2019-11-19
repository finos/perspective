# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import six
import numpy as np
import pandas as pd
from datetime import date, datetime
from functools import partial
from types import MethodType
from pytest import raises
from perspective import PerspectiveError, PerspectiveWidget, Table


def mock_post(self, msg, msg_id=None, assert_msg=None):
    '''Mock the widget's `post()` method so we can introspect the contents.'''
    assert msg == assert_msg


class TestWidget:

    def test_widget(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data, plugin="x_bar")
        assert widget.plugin == "x_bar"

    def test_widget_no_data(self):
        widget = PerspectiveWidget(None, plugin="x_bar", row_pivots=["a"])
        assert widget.plugin == "x_bar"
        assert widget.row_pivots == ["a"]

    def test_widget_schema_with_index(self):
        widget = PerspectiveWidget({"a": int}, index="a")
        assert widget.table._index == "a"

    def test_widget_schema_with_limit(self):
        widget = PerspectiveWidget({"a": int}, limit=5)
        assert widget.table._limit == 5

    def test_widget_no_data_with_index(self):
        # should fail
        with raises(PerspectiveError):
            PerspectiveWidget(None, index="a")

    def test_widget_no_data_with_limit(self):
        # should fail
        with raises(PerspectiveError):
            PerspectiveWidget(None, limit=5)

    def test_widget_load_table(self):
        table = Table({"a": np.arange(0, 50)})
        widget = PerspectiveWidget(table, plugin="x_bar")
        assert widget.plugin == "x_bar"

    def test_widget_load_table_ignore_limit(self):
        table = Table({"a": np.arange(0, 50)})
        widget = PerspectiveWidget(table, limit=1)
        assert widget.table.size() == 50

    def test_widget_pass_options(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data, limit=1)
        assert widget.table.size() == 1

    def test_widget_pass_options_invalid(self):
        data = {"a": np.arange(0, 50)}
        with raises(PerspectiveError):
            PerspectiveWidget(data, index="index", limit=1)

    # client-only mode

    def test_widget_client(self):
        data = {"a": [i for i in range(50)]}
        widget = PerspectiveWidget(data, client=True)
        assert widget.table is None
        assert widget._data == data

    def test_widget_client_np(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data, client=True)
        assert widget.table is None
        assert widget._data == {
            "a": [i for i in range(50)]
        }

    def test_widget_client_df(self):
        data = pd.DataFrame({
            "a": np.arange(10),
            "b": [True for i in range(10)],
            "c": [str(i) for i in range(10)]
        })
        widget = PerspectiveWidget(data, client=True)
        assert widget.table is None
        assert widget._data == {
            "index": [i for i in range(10)],
            "a": [i for i in range(10)],
            "b": [True for i in range(10)],
            "c": [str(i) for i in range(10)]
        }

    def test_widget_client_np_structured_array(self):
        data = np.array([(1, 2), (3, 4)], dtype=[("a", "int64"), ("b", "int64")])
        widget = PerspectiveWidget(data, client=True)
        assert widget.table is None
        assert widget._data == {
            "a": [1, 3],
            "b": [2, 4]
        }

    def test_widget_client_np_recarray(self):
        data = np.array([(1, 2), (3, 4)], dtype=[("a", "int64"), ("b", "int64")]).view(np.recarray)
        widget = PerspectiveWidget(data, client=True)
        assert widget.table is None
        assert widget._data == {
            "a": [1, 3],
            "b": [2, 4]
        }

    def test_widget_client_schema(self):
        widget = PerspectiveWidget({
            "a": int,
            "b": float,
            "c": bool,
            "d": date,
            "e": datetime,
            "f": str
        }, client=True)
        assert widget.table is None
        assert widget._data == {
            "a": "integer",
            "b": "float",
            "c": "boolean",
            "d": "date",
            "e": "datetime",
            "f": "string"
        }

    def test_widget_client_schema_py2_types(self):
        if six.PY2:
            widget = PerspectiveWidget({
                "a": long,  # noqa: F821
                "b": float,
                "c": bool,
                "d": date,
                "e": datetime,
                "f": unicode  # noqa: F821
            }, client=True)
            assert widget.table is None
            assert widget._data == {
                "a": "integer",
                "b": "float",
                "c": "boolean",
                "d": "date",
                "e": "datetime",
                "f": "string"
            }

    def test_widget_client_update(self):
        data = {"a": np.arange(0, 50)}
        comparison_data = {
            "a": [i for i in range(50)]
        }
        widget = PerspectiveWidget(data, client=True)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "update",
            "data": comparison_data
        })
        widget.post = MethodType(mocked_post, widget)
        widget.update(data)
        assert widget.table is None
        assert widget._data == comparison_data

    # clear

    def test_widget_clear(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data)
        widget.clear()
        assert widget.table.size() == 0

    def test_widget_client_clear(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data, client=True)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "clear"
        })
        widget.post = MethodType(mocked_post, widget)
        widget.clear()
        assert widget._data is None

    # replace

    def test_widget_replace(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data)
        widget.replace({"a": [1]})
        assert widget.table.size() == 1

    def test_widget_client_replace(self):
        data = {"a": np.arange(0, 50)}
        new_data = {"a": [1]}
        widget = PerspectiveWidget(data, client=True)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "replace",
            "data": new_data
        })
        widget.post = MethodType(mocked_post, widget)
        widget.replace(new_data)
        assert widget._data is new_data

    # delete

    def test_widget_delete(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "delete"
        })
        widget.post = MethodType(mocked_post, widget)
        widget.delete()
        assert widget.table is None

    def test_widget_delete_client(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data, client=True)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "delete"
        })
        widget.delete()
        widget.post = MethodType(mocked_post, widget)
