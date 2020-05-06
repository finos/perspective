################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table import Table

data = {
    "a": [1, 2, 3, 4],
    "b": ["a", "b", "c", "d"],
    "c": [True, False, True, False]
}


class TestPorts(object):

    def test_make_port_sequential(self):
        table = Table(data)
        port_ids = []

        for i in range(10):
            port_ids.append(table.make_and_get_input_port())

        assert port_ids == list(range(1, 11))

    def test_make_port_sequential_and_update(self):
        table = Table(data)
        port_ids = []

        for i in range(10):
            port_ids.append(table.make_and_get_input_port())

        assert port_ids == list(range(1, 11))

        for i in range(1, 11):
            table.update({
                "a": [i],
                "b": ["a"],
                "c": [True]
            }, port_id=i)

        view = table.view()
        result = view.to_dict()

        assert result == {
            "a": [1, 2, 3, 4] + [i for i in range(1, 11)],
            "b": ["a", "b", "c", "d"] + ["a" for i in range(10)],
            "c": [True, False, True, False] + [True for i in range(10)]
        }
