################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from datetime import date
import pandas as pd
import numpy as np
from perspective import Table, PerspectiveWidget
from ..common import superstore

DF = superstore(200)


class TestWidgetPandas:

    def test_widget_load_table_df(self):
        table = Table(DF)
        widget = PerspectiveWidget(table)
        assert widget.table.schema() == {'Country': str, 'index': int, 'Region': str, 'Category': str, 'City': str, 'Customer ID': str, 'Discount': float,
                                         'Order Date': date, 'Order ID': str, 'Postal Code': str, 'Product ID': str, 'Profit': float, 'Quantity': int,
                                         'Row ID': int, 'Sales': int, 'Segment': str, 'Ship Date': date, 'Ship Mode': str, 'State': str, 'Sub-Category': str}

        assert sorted(widget.columns) == sorted(['Category', 'City', 'Country', 'Customer ID', 'Discount', 'index', 'Order Date', 'Order ID', 'Postal Code',
                                                 'Product ID', 'Profit', 'Quantity', 'Region', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                                 'Ship Mode', 'State', 'Sub-Category'])
        view = widget.table.view()
        assert view.num_rows() == len(DF)
        assert view.num_columns() == len(DF.columns) + 1  # index column

    def test_widget_load_data_df(self):
        widget = PerspectiveWidget(DF)
        assert sorted(widget.columns) == sorted(['Category', 'City', 'Country', 'Customer ID', 'Discount', 'index', 'Order Date', 'Order ID', 'Postal Code',
                                                 'Product ID', 'Profit', 'Quantity', 'Region', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                                 'Ship Mode', 'State', 'Sub-Category'])
        view = widget.table.view()
        assert view.num_rows() == len(DF)
        assert view.num_columns() == 20

    def test_widget_load_series(self):
        series = pd.Series(DF["Profit"].values, name="profit")
        widget = PerspectiveWidget(series)
        assert widget.table.schema() == {'index': int, 'profit': float}

        assert sorted(widget.columns) == sorted(["index", "profit"])
        view = widget.table.view()
        assert view.num_rows() == len(DF)
        assert view.num_columns() == 2

    def test_widget_load_pivot_table(self):
        pivot_table = pd.pivot_table(DF, values='Discount', index=['Country', 'Region'], columns='Category')
        widget = PerspectiveWidget(pivot_table)
        assert widget.row_pivots == ['Country', 'Region']
        assert widget.column_pivots == []
        assert widget.columns == ['Financials', 'Industrials', 'Technology']
        # table should host flattened data
        view = widget.table.view()
        assert view.num_rows() == 5
        assert view.num_columns() == 6

    def test_widget_load_pivot_table_with_user_pivots(self):
        pivot_table = pd.pivot_table(DF, values='Discount', index=['Country', 'Region'], columns='Category')
        widget = PerspectiveWidget(pivot_table, row_pivots=["Category", "Segment"])
        assert widget.row_pivots == ['Category', 'Segment']
        assert widget.column_pivots == []
        assert widget.columns == ['Financials', 'Industrials', 'Technology']
        # table should host flattened data
        view = widget.table.view()
        assert view.num_rows() == 5
        assert view.num_columns() == 6

    def test_widget_load_row_pivots(self):
        df_pivoted = DF.set_index(['Country', 'Region'])
        widget = PerspectiveWidget(df_pivoted)
        assert widget.row_pivots == ['Country', 'Region']
        assert widget.column_pivots == []
        assert sorted(widget.columns) == sorted(['Category', 'City', 'Customer ID', 'Discount', 'Order Date', 'Order ID', 'Postal Code',
                                                 'Product ID', 'Profit', 'Quantity', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                                 'Ship Mode', 'State', 'Sub-Category'])
        assert widget.table.size() == 200
        view = widget.table.view()
        assert view.num_rows() == len(DF)
        assert view.num_columns() == len(DF.columns) + 1  # index column

    def test_widget_load_row_pivots_with_user_pivots(self):
        df_pivoted = DF.set_index(['Country', 'Region'])
        widget = PerspectiveWidget(df_pivoted, row_pivots=["Category", "Segment"])
        assert widget.row_pivots == ['Category', 'Segment']
        assert widget.column_pivots == []
        assert sorted(widget.columns) == sorted(['Category', 'City', 'Customer ID', 'Discount', 'Order Date', 'Order ID', 'Postal Code',
                                                 'Product ID', 'Profit', 'Quantity', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                                 'Ship Mode', 'State', 'Sub-Category'])
        assert widget.table.size() == 200
        view = widget.table.view()
        assert view.num_rows() == len(DF)
        assert view.num_columns() == len(DF.columns) + 1  # index column

    def test_widget_load_column_pivots(self):
        arrays = [np.array(['bar', 'bar', 'bar', 'bar', 'baz', 'baz', 'baz', 'baz', 'foo', 'foo', 'foo', 'foo', 'qux', 'qux', 'qux', 'qux']),
                  np.array(['one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two']),
                  np.array(['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'])]
        tuples = list(zip(*arrays))
        index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second', 'third'])
        df_both = pd.DataFrame(np.random.randn(3, 16), index=['A', 'B', 'C'], columns=index)
        widget = PerspectiveWidget(df_both)
        assert widget.columns == [' ']
        assert widget.column_pivots == ['first', 'second', 'third']
        assert widget.row_pivots == ['index']

    def test_widget_load_column_pivots_preserve_user_settings(self):
        arrays = [np.array(['bar', 'bar', 'bar', 'bar', 'baz', 'baz', 'baz', 'baz', 'foo', 'foo', 'foo', 'foo', 'qux', 'qux', 'qux', 'qux']),
                  np.array(['one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two']),
                  np.array(['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'])]
        tuples = list(zip(*arrays))
        index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second', 'third'])
        df_both = pd.DataFrame(np.random.randn(3, 16), index=['A', 'B', 'C'], columns=index)
        widget = PerspectiveWidget(df_both, columns=["first", "third"])
        assert widget.columns == ['first', "third"]
        assert widget.column_pivots == ['first', 'second', 'third']
        assert widget.row_pivots == ['index']
