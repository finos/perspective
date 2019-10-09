# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from perspective.core import Aggregate
from perspective import PerspectiveWidget


class TestAggregates:

    def test_aggregates_widget_load(self):
        aggs = {
            "a": Aggregate.AVG,
            "b": Aggregate.LAST
        }
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data, aggregates=aggs)
        assert widget.aggregates == aggs
