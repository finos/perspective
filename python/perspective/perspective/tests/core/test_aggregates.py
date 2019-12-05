################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from pytest import raises
from perspective import PerspectiveError, PerspectiveViewer,\
                        PerspectiveWidget, Aggregate


class TestAggregates:

    def test_aggregates_widget_load(self):
        aggs = {
            "a": Aggregate.AVG,
            "b": Aggregate.LAST
        }
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data, aggregates=aggs)
        assert widget.aggregates == aggs

    def test_aggregates_widget_setattr(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        widget.aggregates = {
            "a": Aggregate.ANY,
            "b": Aggregate.LAST
        }
        assert widget.aggregates == {
            "a": "any",
            "b": "last"
        }

    def test_aggregates_widget_load_invalid(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        with raises(PerspectiveError):
            PerspectiveWidget(data, aggregates={"a": "?"})

    def test_aggregates_widget_setattr_invalid(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        with raises(PerspectiveError):
            widget.aggregates = {"a": "?"}

    def test_aggregates_widget_init_all(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        for agg in Aggregate:
            widget = PerspectiveWidget(data, aggregates={"a": agg})
            assert widget.aggregates == {"a": agg.value}

    def test_aggregates_widget_set_all(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        for agg in Aggregate:
            widget.aggregates = {"a": agg}
            assert widget.aggregates == {"a": agg.value}

    def test_aggregates_viewer_load(self):
        viewer = PerspectiveViewer(aggregates={"a": Aggregate.AVG})
        assert viewer.aggregates == {"a": "avg"}

    def test_aggregates_viewer_setattr(self):
        viewer = PerspectiveViewer()
        viewer.aggregates = {"a": Aggregate.AVG}
        assert viewer.aggregates == {"a": "avg"}

    def test_aggregates_viewer_init_all(self):
        for agg in Aggregate:
            viewer = PerspectiveViewer(aggregates={"a": agg})
            assert viewer.aggregates == {"a": agg.value}

    def test_aggregates_viewer_set_all(self):
        viewer = PerspectiveViewer()
        for agg in Aggregate:
            viewer.aggregates = {"a": agg}
            assert viewer.aggregates == {"a": agg.value}
