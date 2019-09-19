# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table import Table


class TestUpdate(object):

    def test_update_from_schema(self):
        tbl = Table({
            "a": str,
            "b": int
        })
        tbl.update([{"a": "abc", "b": 123}])
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}]

    def test_update_columnar_from_schema(self):
        tbl = Table({
            "a": str,
            "b": int
        })
        tbl.update({"a": ["abc"], "b": [123]})
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}]

    def test_update_append(self):
        tbl = Table([{"a": "abc", "b": 123}])
        tbl.update([{"a": "def", "b": 456}])
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}, {"a": "def", "b": 456}]

    def test_update_partial(self):
        tbl = Table([{"a": "abc", "b": 123}], {"index": "a"})
        tbl.update([{"a": "abc", "b": 456}])
        assert tbl.view().to_records() == [{"a": "abc", "b": 456}]

    def test_update_columnar_append(self):
        tbl = Table({"a": ["abc"], "b": [123]})
        tbl.update({"a": ["def"], "b": [456]})
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}, {"a": "def", "b": 456}]

    def test_update_columnar_partial(self):
        tbl = Table({"a": ["abc"], "b": [123]}, {"index": "a"})
        tbl.update({"a": ["abc"], "b": [456]})
        assert tbl.view().to_records() == [{"a": "abc", "b": 456}]

    # implicit index

    def test_update_implicit_index(self):
        data = [{"a": 1}, {"a": 2}]
        tbl = Table(data)
        view = tbl.view()
        tbl.update([{
            "__INDEX__": [0],
            "a": 3
        }])
        assert view.to_records() == [{"a": 3}, {"a": 2}]

    def test_update_implicit_index_symmetric(self):
        data = [{"a": 1}, {"a": 2}]
        tbl = Table(data)
        view = tbl.view()
        records = view.to_records({"index": True})
        idx = records[0]["__INDEX__"]
        tbl.update([{
            "__INDEX__": idx,
            "a": 3
        }])
        assert view.to_records() == [{"a": 3}, {"a": 2}]

    def test_update_explicit_index(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}]
        tbl = Table(data, {"index": "a"})
        view = tbl.view()
        tbl.update([{
            "a": 1,
            "b": 3
        }])
        assert view.to_records() == [{"a": 1, "b": 3}, {"a": 2, "b": 3}]