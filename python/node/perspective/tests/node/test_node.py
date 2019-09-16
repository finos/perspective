# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.node import Perspective


class TestNode(object):
    def test_table(self):
        psp = Perspective()
        psp.start()
        psp.table({'x': 'integer', 'y': 'string', 'z': 'float'}, {'index': 'x'})

        psp.update([{'x': 1, 'y': 'a', 'z': 1.0}])
        psp.update([{'x': 2, 'y': 'b', 'z': 2.0}])
        psp.update([{'x': 3, 'y': 'c', 'z': 3.0}])
        psp.update([{'x': 4, 'y': 'd', 'z': 4.0}])
        psp.update([{'x': 5, 'y': 'test', 'z': 4.5}])
        psp.update([{'x': 7, 'y': 'test2', 'z': 2.4}])
        # psp.remove([1, 2])
        print(psp.to_json())

        v = psp.view({'columns': ['x', 'y', 'z'],
                      'aggregates': {'x': 'sum'},
                      'row_pivots': ['x'],
                      'filter': [['y', 'in', ['test']]]})

        print(v.to_json())

        psp.stop()
