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
from perspective import PerspectiveError, PerspectiveViewer, PerspectiveWidget, Aggregate, Table


class TestAggregates:
    def test_aggregates_widget_load(self):
        aggs = {"a": Aggregate.AVG, "b": Aggregate.LAST}
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data, aggregates=aggs)
        assert widget.aggregates == aggs

    def test_aggregates_widget_load_weighted_mean(self):
        aggs = {"a": Aggregate.AVG, "b": ["weighted mean", "a"]}
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data, aggregates=aggs)
        assert widget.aggregates == aggs

    def test_aggregates_widget_setattr(self):
        data = {"a": [1, 2, 3], "b": ["a", "b", "c"]}
        widget = PerspectiveWidget(data)
        widget.aggregates = {"a": Aggregate.ANY, "b": Aggregate.LAST}
        assert widget.aggregates == {"a": "any", "b": "last"}

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

    def get_median(self, input_data):
        table = Table(data=input_data)
        view = table.view(columns=["Price"], aggregates={"Price": "median"}, group_by=["Item"])

        return view.to_json()[0]["Price"]

    def test_aggregate_median(self):
        numeric_data = [
            {"Item": "Book", "Price": 2.0},
            {"Item": "Book", "Price": 3.0},
            {"Item": "Book", "Price": 5.0},
            {"Item": "Book", "Price": 4.0},
            {"Item": "Book", "Price": 8.0},
            {"Item": "Book", "Price": 9.0},
            {"Item": "Book", "Price": 6.0},
        ]

        non_numeric_data = [
            {"Item": "Book", "Price": "2"},
            {"Item": "Book", "Price": "3"},
            {"Item": "Book", "Price": "5"},
            {"Item": "Book", "Price": "4"},
            {"Item": "Book", "Price": "8"},
            {"Item": "Book", "Price": "9"},
            {"Item": "Book", "Price": "6"},
        ]

        # Testing with numeric data
        assert self.get_median(numeric_data) == 5.0  # List = [2.0,3.0,5.0,4.0,8.0,9.0,6.0], median = 5.0
        assert self.get_median(numeric_data[:2]) == 2.5  # List = [2.0,3.0], median = 2.5
        assert self.get_median(numeric_data[5:]) == 7.5  # List = [9.0,6.0], median = 7.5
        assert self.get_median(numeric_data[1:]) == 5.5  # List = [3.0,5.0,4.0,8.0,9.0,6.0], median = 5.5
        assert self.get_median(numeric_data[::2]) == 5.5  # List = [2.0,5.0,8.0,6.0], median = 5.5

        # Testing with non-numeric data
        assert self.get_median(non_numeric_data) == "5"  # List = ['2','3','5','4','8','9','6'], median = '5'
        assert self.get_median(non_numeric_data[:2]) == "3"  # List = ['2','3'], median = '5'
        assert self.get_median(non_numeric_data[5:]) == "9"  # List = ['9','6'], median = '9'
        assert self.get_median(non_numeric_data[1:]) == "6"  # List = ['3','5','4','8','9','6'], median = '6'
        assert self.get_median(non_numeric_data[::2]) == "6"  # List = ['2','5','8','6'], median = '6'
