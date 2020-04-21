################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from pytest import raises
from perspective.core import PerspectiveError
from perspective.core import Plugin
import perspective.viewer.validate as validate


class TestValidate:

    def test_validate_plugin_valid_instance(self):
        assert validate.validate_plugin(Plugin.XBAR) == "x_bar"

    def test_validate_plugin_valid_string(self):
        assert validate.validate_plugin("x_bar") == "x_bar"

    def test_validate_plugin_invalid_string(self):
        with raises(PerspectiveError):
            validate.validate_plugin("invalid")

    def test_validate_filters_valid(self):
        filters = [["a", ">", 1], ["b", "==", "abc"]]
        assert validate.validate_filters(filters) == filters

    def test_validate_filters_invalid(self):
        with raises(PerspectiveError):
            filters = [["a", ">"], ["b", "invalid" "abc"]]
            validate.validate_filters(filters)

    def test_validate_filters_is_null(self):
        filters = [["a", "is null"]]
        assert validate.validate_filters(filters) == filters

    def test_validate_filters_is_not_null(self):
        filters = [["a", "is not null"]]
        assert validate.validate_filters(filters) == filters

    def test_validate_computed_columns_valid(self):
        computed = [{
            "column": "abc",
            "computed_function_name": "+",
            "inputs": ["first", "second"]
        }]
        assert validate.validate_computed_columns(computed) == computed

    def test_validate_computed_columns_invalid(self):
        with raises(PerspectiveError):
            assert validate.validate_computed_columns([{"column": "abc", "inputs": ["first", "second"]}])

    def test_validate_computed_columns_str(self):
        computed = ["expression"]
        assert validate.validate_computed_columns(computed) == computed
