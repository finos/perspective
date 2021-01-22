################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import six
import os
import numpy as np
import pandas as pd
from datetime import date, datetime
from functools import partial
from types import MethodType

if os.name == 'nt':
    BINDING = 'libbinding.pyd'
    PSP = 'libpsp.dll'
else:
    BINDING = 'libbinding.so'
    PSP = 'libpsp.so'

# rename libbinding.so and libpsp.so temporarily to ensure that client mode
# works automatically when the C++ build fails.
lib_path = os.path.join(os.path.dirname(__file__), "..", "..", "table")
binding = os.path.join(lib_path, BINDING)
psp = os.path.join(lib_path, PSP)
new_binding = os.path.join(lib_path, "notlibbinding.so")
new_psp = os.path.join(lib_path, "notlibpsp.so")


def mock_post(self, msg, msg_id=None, assert_msg=None):
    '''Mock the widget's `post()` method so we can introspect the contents.'''
    assert msg == assert_msg


def setup_module():
    os.rename(binding, new_binding)
    os.rename(psp, new_psp)
    assert os.path.exists(new_binding)
    assert os.path.exists(new_psp)
    assert not os.path.exists(binding)
    assert not os.path.exists(psp)


def teardown_module():
    os.rename(new_binding, binding)
    os.rename(new_psp, psp)
    assert os.path.exists(binding)
    assert os.path.exists(psp)
    assert not os.path.exists(new_binding)
    assert not os.path.exists(new_psp)


class TestClient(object):

    def test_widget_client(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = {"a": [i for i in range(50)]}
        widget = perspective.PerspectiveWidget(data)
        assert hasattr(widget, "table") is False
        assert widget._data == data

    def test_widget_client_np(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = {"a": np.arange(0, 50)}
        widget = perspective.PerspectiveWidget(data)
        assert hasattr(widget, "table") is False
        assert widget._data == {
            "a": [i for i in range(50)]
        }

    def test_widget_client_df(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = pd.DataFrame({
            "a": np.arange(10),
            "b": [True for i in range(10)],
            "c": [str(i) for i in range(10)]
        })
        widget = perspective.PerspectiveWidget(data)
        assert hasattr(widget, "table") is False
        assert widget._data == {
            "index": [i for i in range(10)],
            "a": [i for i in range(10)],
            "b": [True for i in range(10)],
            "c": [str(i) for i in range(10)]
        }

    def test_widget_client_np_structured_array(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = np.array([(1, 2), (3, 4)], dtype=[("a", "int64"), ("b", "int64")])
        widget = perspective.PerspectiveWidget(data)
        assert hasattr(widget, "table") is False
        assert widget._data == {
            "a": [1, 3],
            "b": [2, 4]
        }

    def test_widget_client_np_recarray(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = np.array([(1, 2), (3, 4)], dtype=[("a", "int64"), ("b", "int64")]).view(np.recarray)
        widget = perspective.PerspectiveWidget(data)
        assert hasattr(widget, "table") is False
        assert widget._data == {
            "a": [1, 3],
            "b": [2, 4]
        }

    def test_widget_client_schema(self):
        import perspective
        assert perspective.is_libpsp() is False
        widget = perspective.PerspectiveWidget({
            "a": int,
            "b": float,
            "c": bool,
            "d": date,
            "e": datetime,
            "f": str
        })
        assert hasattr(widget, "table") is False
        assert widget._data == {
            "a": "integer",
            "b": "float",
            "c": "boolean",
            "d": "date",
            "e": "datetime",
            "f": "string"
        }

    def test_widget_client_schema_py2_types(self):
        import perspective
        assert perspective.is_libpsp() is False
        if six.PY2:
            widget = perspective.PerspectiveWidget({
                "a": long,  # noqa: F821
                "b": float,
                "c": bool,
                "d": date,
                "e": datetime,
                "f": unicode  # noqa: F821
            })
            assert hasattr(widget, "table") is False
            assert widget._data == {
                "a": "integer",
                "b": "float",
                "c": "boolean",
                "d": "date",
                "e": "datetime",
                "f": "string"
            }

    def test_widget_client_update(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = {"a": np.arange(0, 50)}
        comparison_data = {
            "a": [i for i in range(50)]
        }
        widget = perspective.PerspectiveWidget(data)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "update",
            "data": comparison_data
        })
        widget.post = MethodType(mocked_post, widget)
        widget.update(data)
        assert hasattr(widget, "table") is False

    def test_widget_client_update_cached(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = {"a": [1, 2]}
        widget = perspective.PerspectiveWidget(data)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "update",
            "data": data
        })
        widget.post = MethodType(mocked_post, widget)
        widget.update(data)
        assert widget._predisplay_update_cache == [data]
        widget._displayed = True
        widget.update(data)
        assert widget._predisplay_update_cache == [data]

    def test_widget_client_replace(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = {"a": np.arange(0, 50)}
        new_data = {"a": [1]}
        widget = perspective.PerspectiveWidget(data)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "replace",
            "data": new_data
        })
        widget.post = MethodType(mocked_post, widget)
        widget.replace(new_data)
        assert widget._data is new_data

    def test_widget_delete_client(self):
        import perspective
        assert perspective.is_libpsp() is False
        data = {"a": np.arange(0, 50)}
        widget = perspective.PerspectiveWidget(data)
        mocked_post = partial(mock_post, assert_msg={
            "cmd": "delete"
        })
        widget.delete()
        widget.post = MethodType(mocked_post, widget)

    def test_widget_load_column_pivots_client(self):
        import perspective
        assert perspective.is_libpsp() is False
        # behavior should not change for client mode
        arrays = [np.array(['bar', 'bar', 'bar', 'bar', 'baz', 'baz', 'baz', 'baz', 'foo', 'foo', 'foo', 'foo', 'qux', 'qux', 'qux', 'qux']),
                  np.array(['one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two']),
                  np.array(['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'])]
        tuples = list(zip(*arrays))
        index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second', 'third'])
        df_both = pd.DataFrame(np.random.randn(3, 16), index=['A', 'B', 'C'], columns=index)
        widget = perspective.PerspectiveWidget(df_both)
        assert hasattr(widget, "table") is False
        assert widget.columns == [' ']
        assert widget.column_pivots == ['first', 'second', 'third']
        assert widget.row_pivots == ['index']