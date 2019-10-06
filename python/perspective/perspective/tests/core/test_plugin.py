# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from perspective.core import Plugin
from perspective import PerspectiveWidget


class TestPlugin:

    def test_plugin_widget_load(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(plugin=Plugin.XBAR)
        widget.load(data)
        assert widget.plugin == "x_bar"
