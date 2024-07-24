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

from datetime import date, datetime
from pytest import mark
import perspective as psp

client = psp.Server().new_local_client()
Table = client.table


class TestTableInfer(object):
    def test_table_limit_wraparound_does_not_respect_partial_none(self):
        t = Table({"a": "float", "b": "float"}, limit=3)
        t.update([{"a": 10}, {"b": 1}, {"a": 20}, {"a": None, "b": 2}])
        d1 = t.view().to_json()

        t2 = Table({"a": "float", "b": "float"}, limit=3)
        t2.update([{"a": 10}, {"b": 1}, {"a": 20}, {"b": 2}])
        d2 = t2.view().to_json()

        assert d1[0] != d2[0]
        assert d1[1:] == d2[1:]

    def test_table_limit_wraparound_does_not_respect_partial(self):
        t = Table({"a": "float", "b": "float"}, limit=3)
        t.update([{"a": 10}, {"b": 1}, {"a": 20}, {"a": 10, "b": 2}])
        d1 = t.view().to_columns()

        t2 = Table({"a": "float", "b": "float"}, limit=3)
        t2.update([{"a": 10}, {"b": 1}, {"a": 20}, {"b": 2}])
        d2 = t2.view().to_columns()

        assert d1 == d2
