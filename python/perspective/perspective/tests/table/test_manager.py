# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from perspective.table import Table, PerspectiveManager

data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}


class TestPerspectiveManager(object):

    def post(self, msg):
        '''boilerplate callback to simulate a client's `post()` method.'''
        assert msg["id"] is not None

    def test_manager_host_table(self):
        message = {"id": 1, "name": "table1", "cmd": "table_method", "method": "schema", "args": []}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        assert manager._tables["table1"].schema() == {
            "a": int,
            "b": str
        }

    def test_manager_create_table(self):
        message = {"id": 1, "name": "table1", "cmd": "table", "args": [data]}
        manager = PerspectiveManager()
        manager.process(message, self.post)
        assert manager._tables["table1"].schema() == {
            "a": int,
            "b": str
        }

    def test_manager_create_indexed_table(self):
        message = {"id": 1, "name": "table1", "cmd": "table", "args": [data], "options": {"index": "a"}}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        assert manager._tables["table1"].schema() == {
            "a": int,
            "b": str
        }

        assert manager._tables["table1"]._index == "a"

    def test_manager_create_indexed_table_and_update(self):
        message = {"id": 1, "name": "table1", "cmd": "table", "args": [data], "options": {"index": "a"}}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        assert manager._tables["table1"].schema() == {
            "a": int,
            "b": str
        }
        assert manager._tables["table1"]._index == "a"
        update_message = {"id": 2, "name": "table1", "cmd": "table_method", "method": "update", "args": [{"a": [1, 2, 3], "b": ["str1", "str2", "str3"]}]}
        manager.process(update_message, self.post)
        assert manager._tables["table1"].view().to_dict() == {
            "a": [1, 2, 3],
            "b": ["str1", "str2", "str3"]
        }

    def test_manager_create_view_zero(self):
        message = {"id": 1, "table_name": "table1", "view_name": "view1", "cmd": "view"}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        assert manager._views["view1"].num_rows() == 3

    def test_manager_create_view_one(self):
        message = {"id": 1, "table_name": "table1", "view_name": "view1", "cmd": "view", "config": {"row_pivots": ["a"]}}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        assert manager._views["view1"].to_dict() == {
            "__ROW_PATH__": [[], ["1"], ["2"], ["3"]],
            "a": [6, 1, 2, 3],
            "b": [3, 1, 1, 1]
        }

    def test_manager_create_view_two(self):
        message = {"id": 1, "table_name": "table1", "view_name": "view1", "cmd": "view", "config": {"row_pivots": ["a"], "column_pivots": ["b"]}}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        assert manager._views["view1"].to_dict() == {
            "__ROW_PATH__": [[], ["1"], ["2"], ["3"]],
            "a|a": [1, 1, None, None],
            "a|b": [1, 1, None, None],
            "b|a": [2, None, 2, None],
            "b|b": [1, None, 1, None],
            "c|a": [3, None, None, 3],
            "c|b": [1, None, None, 1]
        }

    def test_manager_to_dict(self):
        def handle_to_dict(msg):
            assert msg["data"] == data
        message = {"id": 1, "table_name": "table1", "view_name": "view1", "cmd": "view"}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        to_dict_message = {"id": 2, "name": "view1", "cmd": "view_method", "method": "to_dict"}
        manager.process(to_dict_message, handle_to_dict)

    def test_manager_create_view_and_update_table(self):
        message = {"id": 1, "table_name": "table1", "view_name": "view1", "cmd": "view"}
        manager = PerspectiveManager()
        table = Table(data)
        manager.host_table("table1", table)
        manager.process(message, self.post)
        table.update([{"a": 4, "b": "d"}])
        assert manager._views["view1"].num_rows() == 4

    def test_manager_on_update(self):
        sentinel = 0

        def update_callback():
            nonlocal sentinel
            sentinel += 1

        # create a table and view using manager
        make_table = {"id": 1, "name": "table1", "cmd": "table", "args": [data]}
        manager = PerspectiveManager()
        manager.process(make_table, self.post)
        make_view = {"id": 2, "table_name": "table1", "view_name": "view1", "cmd": "view"}
        manager.process(make_view, self.post)

        # hook into the created view and pass it the callback
        view = manager._views["view1"]
        view.on_update(update_callback)

        # call updates
        update1 = {"id": 3, "name": "table1", "cmd": "table_method", "method": "update", "args": [{"a": [4], "b": ["d"]}]}
        update2 = {"id": 4, "name": "table1", "cmd": "table_method", "method": "update", "args": [{"a": [5], "b": ["e"]}]}
        manager.process(update1, self.post)
        manager.process(update2, self.post)
        assert sentinel == 2

    def test_manager_remove_update(self):
        sentinel = 0

        def update_callback():
            nonlocal sentinel
            sentinel += 1

        # create a table and view using manager
        make_table = {"id": 1, "name": "table1", "cmd": "table", "args": [data]}
        manager = PerspectiveManager()
        manager.process(make_table, self.post)
        make_view = {"id": 2, "table_name": "table1", "view_name": "view1", "cmd": "view"}
        manager.process(make_view, self.post)

        # hook into the created view and pass it the callback
        view = manager._views["view1"]
        view.on_update(update_callback)
        view.remove_update(update_callback)

        # call updates
        update1 = {"id": 4, "name": "table1", "cmd": "table_method", "method": "update", "args": [{"a": [4], "b": ["d"]}]}
        update2 = {"id": 5, "name": "table1", "cmd": "table_method", "method": "update", "args": [{"a": [5], "b": ["e"]}]}
        manager.process(update1, self.post)
        manager.process(update2, self.post)
        assert sentinel == 0

    def test_manager_delete_view(self):
        make_table = {"id": 1, "name": "table1", "cmd": "table", "args": [data]}
        manager = PerspectiveManager()
        manager.process(make_table, self.post)
        make_view = {"id": 2, "table_name": "table1", "view_name": "view1", "cmd": "view"}
        manager.process(make_view, self.post)
        delete_view = {"id": 3, "name": "view1", "cmd": "view_method", "method": "delete"}
        manager.process(delete_view, self.post)
        assert len(manager._views) == 0
