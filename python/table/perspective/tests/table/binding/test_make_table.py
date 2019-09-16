# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table.libbinding import make_table, t_op
from perspective.table._accessor import _PerspectiveAccessor


class TestMakeTable(object):
    def test_make_table(self):
        data = _PerspectiveAccessor([{"a": 1, "b": 2}, {"a": 3, "b": 3}])
        tbl = make_table(None, data, None, 4294967295, '', t_op.OP_INSERT, False, False)
        assert tbl.size() == 2
