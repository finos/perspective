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