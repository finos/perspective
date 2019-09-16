# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


class TestLayout:
    def setup(self):
        pass
        # setup() before each test method

    def test_convert_to_psp_schema(self):
        from perspective.core.schema import convert_to_psp_schema
        x = {1: 'float', 2: 'integer', 3: 'bool', 4: 'time', 5: 'str'}
        y = {1: 'float', 2: 'integer', 3: 'boolean', 4: 'date', 5: 'string'}
        assert y == convert_to_psp_schema(x)
