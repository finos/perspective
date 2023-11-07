#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

from pytest import raises
from perspective.core import PerspectiveError
from perspective.core import Plugin
import perspective.viewer.validate as validate
from perspective.viewer.viewer import PerspectiveViewer


class TestValidate:
    def test_validate_plugin_valid_instance(self):
        assert validate.validate_plugin(Plugin.XBAR) == "X Bar"

    def test_validate_plugin_valid_instance_datagrid(self):
        assert validate.validate_plugin(Plugin.GRID) == "Datagrid"

    def test_validate_plugin_valid_string(self):
        assert validate.validate_plugin("X Bar") == "X Bar"

    def test_validate_plugin_invalid_string(self):
        with raises(PerspectiveError):
            validate.validate_plugin("invalid")

    def test_validate_plugin_invalid_string_hypergrid(self):
        with raises(PerspectiveError):
            validate.validate_plugin("hypergrid")

    def test_validate_filter_valid(self):
        filters = [["a", ">", 1], ["b", "==", "abc"]]
        assert validate.validate_filter(filters) == filters

    def test_validate_filter_invalid(self):
        with raises(PerspectiveError):
            filters = [["a", ">"], ["b", "invalid" "abc"]]
            validate.validate_filter(filters)

    def test_validate_filter_is_null(self):
        filters = [["a", "is null"]]
        assert validate.validate_filter(filters) == filters

    def test_validate_filter_is_not_null(self):
        filters = [["a", "is not null"]]
        assert validate.validate_filter(filters) == filters

    def test_validate_expressions(self):
        computed = ["// expression1 \n 'Hello'"]
        assert validate.validate_expressions(computed) == computed
        computed = [{"name": "expression1", "expr": "'hey'"}]
        assert validate.validate_expressions(computed) == computed

    def test_validate_expressions_invalid(self):
        with raises(PerspectiveError):
            assert validate.validate_expressions({})

    def test_validate_version(self):
        assert validate.validate_version("1.0.0")
        assert validate.validate_version("0.0.0+2.3.2")
        assert not validate.validate_version("abc")
        assert validate.validate_version(PerspectiveViewer.API_VERSION)
