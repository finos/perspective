################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table import Table


class TestRemove(object):

    def test_remove_all(self):
        tbl = Table([{"a": "abc", "b": 123}], index="a")
        tbl.remove(["abc"])
        assert tbl.view().to_records() == []
        # assert tbl.size() == 0

    def test_remove_nonsequential(self):
        tbl = Table([{"a": "abc", "b": 123}, {"a": "def", "b": 456}, {"a": "efg", "b": 789}], index="a")
        tbl.remove(["abc", "efg"])
        assert tbl.view().to_records() == [{"a": "def", "b": 456}]
        # assert tbl.size() == 1

    def test_remove_multiple_single(self):
        tbl = Table({"a": int, "b": str}, index="a")
        for i in range(0, 10):
            tbl.update([{"a": i, "b": str(i)}])
        for i in range(1, 10):
            tbl.remove([i])
        assert tbl.view().to_records() == [{"a": 0, "b": "0"}]
        # assert tbl.size() == 0
