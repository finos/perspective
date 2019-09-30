# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from perspective.table import Table


class TestDelete(object):

    # delete

    def test_table_delete(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        tbl.delete()
        # don't segfault

    def test_table_delete_callback(self):
        sentinel = False

        def callback():
            nonlocal sentinel
            sentinel = True
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        tbl.on_delete(callback)
        tbl.delete()
        assert sentinel == True

    def test_table_delete_with_view(self):
        sentinel = False

        def callback():
            nonlocal sentinel
            sentinel = True
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        tbl.on_delete(callback)
        view = tbl.view()
        view.delete()
        tbl.delete()
        assert sentinel == True

    def test_table_delete_multiple_callback(self):
        sentinel1 = False
        sentinel2 = False
        
        def callback1():
            nonlocal sentinel1
            sentinel1 = True

        def callback2():
            nonlocal sentinel2
            sentinel2 = True

        tbl = Table([{"a": 1}])
        tbl.on_delete(callback1)
        tbl.on_delete(callback2)

        tbl.delete()

        assert sentinel1 == True
        assert sentinel2 == True

    def test_table_remove_delete_callback(self):
        sentinel = False

        def callback():
            nonlocal sentinel
            sentinel = True

        tbl = Table([{"a": 1}])
        tbl.on_delete(callback)
        tbl.remove_delete(callback)

        tbl.delete()

        assert sentinel == False

    def test_view_delete_multiple_callback(self):
        sentinel1 = False
        sentinel2 = False
        
        def callback1():
            nonlocal sentinel1
            sentinel1 = True

        def callback2():
            nonlocal sentinel2
            sentinel2 = True

        tbl = Table([{"a": 1}])
        view = tbl.view()

        view.on_delete(callback1)
        view.on_delete(callback2)

        view.delete()
        tbl.delete()

        assert sentinel1 == True
        assert sentinel2 == True

    def test_view_remove_delete_callback(self):
        sentinel = False

        def callback():
            nonlocal sentinel
            sentinel = True

        tbl = Table([{"a": 1}])
        view = tbl.view()

        view.on_delete(callback)
        view.remove_delete(callback)

        view.delete()
        tbl.delete()

        assert sentinel == False