################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import numpy as np
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

    def test_widget_schema(self):
        schema = {
            "a": int,
            "b": float,
            "c": bool,
            "d": date,
            "e": datetime,
            "f": str
        }
        widget = PerspectiveWidget(schema)
        assert widget.table.schema() == schema

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

    # clear

    def test_widget_clear(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data)
        widget.clear()
        assert widget.table.size() == 0

    # replace

    def test_widget_replace(self):
        data = {"a": np.arange(0, 50)}
        widget = PerspectiveWidget(data)
        widget.replace({"a": [1]})
        assert widget.table.size() == 1

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
