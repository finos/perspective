# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import numpy as np
from perspective import start, Table


class TestStart:
    def setup(self):
        pass
        # setup() before each test method

    def test_start(self):
        data = {"a": np.arange(0, 50)}
        widget = start(data, plugin="x_bar")
        assert widget.plugin == "x_bar"

    def test_start_load_table(self):
        table = Table({"a": np.arange(0, 50)})
        widget = start(table, plugin="x_bar")
        assert widget.plugin == "x_bar"

    def test_start_load_table_ignore_limit(self):
        table = Table({"a": np.arange(0, 50)})
        widget = start(table, limit=1)
        table_name = list(widget.manager._tables.keys())[0]
        assert widget.manager.get_table(table_name).size() == 50

    def test_start_pass_options(self):
        data = {"a": np.arange(0, 50)}
        widget = start(data, limit=1)
        table_name = list(widget.manager._tables.keys())[0]
        assert widget.manager.get_table(table_name).size() == 1
