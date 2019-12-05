################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from pytest import raises
from perspective import PerspectiveError, PerspectiveViewer,\
                        PerspectiveWidget, Plugin


class TestPlugin:

    def test_plugin_widget_load(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data, plugin=Plugin.XBAR)
        assert widget.plugin == "x_bar"

    def test_plugin_widget_setattr(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        widget.plugin = Plugin.XBAR
        assert widget.plugin == "x_bar"

    def test_plugin_widget_load_invalid(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        with raises(PerspectiveError):
            PerspectiveWidget(data, plugin="?")

    def test_plugin_widget_setattr_invalid(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data) 
        with raises(PerspectiveError):
            widget.plugin = "?"

    def test_plugin_widget_init_all(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        for plugin in Plugin:
            widget = PerspectiveWidget(data, plugin=plugin)
            assert widget.plugin == plugin.value

    def test_plugin_widget_set_all(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        for plugin in Plugin:
            widget.plugin = plugin
            assert widget.plugin == plugin.value

    def test_plugin_viewer_load(self):
        viewer = PerspectiveViewer(plugin=Plugin.XBAR)
        assert viewer.plugin == "x_bar"

    def test_plugin_viewer_setattr(self):
        viewer = PerspectiveViewer()
        viewer.plugin = Plugin.XBAR
        assert viewer.plugin == "x_bar"

    def test_plugin_viewer_init_all(self):
        for plugin in Plugin:
            viewer = PerspectiveViewer(plugin=plugin)
            assert viewer.plugin == plugin.value

    def test_plugin_viewer_set_all(self):
        viewer = PerspectiveViewer()
        for plugin in Plugin:
            viewer.plugin = plugin
            assert viewer.plugin == plugin.value
