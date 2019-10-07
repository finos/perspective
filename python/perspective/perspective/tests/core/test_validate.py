# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from pytest import raises
from perspective.core.exception import PerspectiveError
import perspective.core.aggregate
import perspective.core.filters
import perspective.core.plugin
import perspective.core.validate


class TestValidate:

    def test_validate_plugin_valid_instance(self):
        assert perspective.core.validate.validate_plugin(perspective.core.plugin.Plugin.XBAR) == "x_bar"

    def test_validate_plugin_valid_string(self):
        assert perspective.core.validate.validate_plugin("x_bar") == "x_bar"

    def test_validate_plugin_invalid_string(self):
        with raises(PerspectiveError):
            perspective.core.validate.validate_plugin("invalid")
