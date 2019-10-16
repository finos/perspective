# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from pytest import raises
from perspective import Table
from perspective.table.libbinding import PerspectiveCppError


class TestException(object):

    def test_exception_from_core(self):
        tbl = Table({"a": [1, 2, 3]})
        with raises(PerspectiveCppError) as ex:
            # creating view with unknown column should throw
            tbl.view(row_pivots=["b"])
            assert str(ex.value) == "Column b does not exist in schema."

    def test_exception_from_core_catch_all(self):
        tbl = Table({"a": [1, 2, 3]})
        with raises(Exception) as ex:
            tbl.view(row_pivots=["b"])
            assert str(ex.value) == "Column b does not exist in schema."
