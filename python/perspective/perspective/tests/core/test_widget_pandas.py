# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from datetime import date
import pandas as pd
import numpy as np
from perspective import PerspectiveWidget, Table
from random import random, randint, choice
from faker import Faker
fake = Faker()


def superstore(count=50):
    data = []
    for id in range(count):
        dat = {}
        dat['Row ID'] = id
        dat['Order ID'] = fake.ein()
        dat['Order Date'] = fake.date_this_year()
        dat['Ship Date'] = fake.date_between_dates(dat['Order Date']).strftime('%Y-%m-%d')
        dat['Order Date'] = dat['Order Date'].strftime('%Y-%m-%d')
        dat['Ship Mode'] = choice(['First Class', 'Standard Class', 'Second Class'])
        dat['Ship Mode'] = choice(['First Class', 'Standard Class', 'Second Class'])
        dat['Customer ID'] = fake.license_plate()
        dat['Segment'] = choice(['A', 'B', 'C', 'D'])
        dat['Country'] = 'US'
        dat['City'] = fake.city()
        dat['State'] = fake.state()
        dat['Postal Code'] = fake.zipcode()
        dat['Region'] = choice(['Region %d' % i for i in range(5)])
        dat['Product ID'] = fake.bban()
        sector = choice(['Industrials', 'Technology', 'Financials'])
        industry = choice(['A', 'B', 'C'])
        dat['Category'] = sector
        dat['Sub-Category'] = industry
        dat['Sales'] = randint(1, 100) * 100
        dat['Quantity'] = randint(1, 100) * 10
        dat['Discount'] = round(random() * 100, 2)
        dat['Profit'] = round(random() * 1000, 2)
        data.append(dat)
    return pd.DataFrame(data)


DF = superstore()


class TestWidgetPandas:

    def test_widget_load_table_df(self):
        table = Table(DF)
        widget = PerspectiveWidget()
        widget.load(table)
        print(widget.columns, widget)
        assert table.schema() == {'Country': str, 'Region': str, 'Category': str, 'City': str, 'Customer ID': str, 'Discount': float,
                                  'Order Date': date, 'Order ID': str, 'Postal Code': str, 'Product ID': str, 'Profit': float, 'Quantity': int,
                                  'Row ID': int, 'Sales': int, 'Segment': str, 'Ship Date': date, 'Ship Mode': str, 'State': str, 'Sub-Category': str}

        assert sorted(widget.columns) == sorted(['Category', 'City', 'Customer ID', 'Discount', 'Order Date', 'Order ID', 'Postal Code',
                                                 'Product ID', 'Profit', 'Quantity', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                                 'Ship Mode', 'State', 'Sub-Category'])

    def test_widget_load_data_df(self):
        widget = PerspectiveWidget()
        widget.load(DF)
        assert sorted(widget.columns) == sorted(['Category', 'City', 'Customer ID', 'Discount', 'Order Date', 'Order ID', 'Postal Code',
                                                 'Product ID', 'Profit', 'Quantity', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                                 'Ship Mode', 'State', 'Sub-Category'])

    def test_widget_load_row_pivots(self):
        df_pivoted = DF.set_index(['Country', 'Region'])
        widget = PerspectiveWidget()
        widget.load(df_pivoted)
        assert widget.row_pivots == ['Country', 'Region']
        assert widget.column_pivots == []
        assert sorted(widget.columns) == sorted(['Category', 'City', 'Customer ID', 'Discount', 'Order Date', 'Order ID', 'Postal Code',
                                                 'Product ID', 'Profit', 'Quantity', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                                 'Ship Mode', 'State', 'Sub-Category'])

    def test_widget_load_pivot_table(self):
        pivot_table = pd.pivot_table(DF, values='Discount', index=['Country', 'Region'], columns='Category')
        widget = PerspectiveWidget()
        widget.load(pivot_table)
        assert widget.row_pivots == ['Country', 'Region']
        assert widget.column_pivots == []
        assert widget.columns == ['Financials', 'Industrials', 'Technology']

    def test_widget_load_column_pivots(self):
        arrays = [np.array(['bar', 'bar', 'bar', 'bar', 'baz', 'baz', 'baz', 'baz', 'foo', 'foo', 'foo', 'foo', 'qux', 'qux', 'qux', 'qux']),
                  np.array(['one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two']),
                  np.array(['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'])]
        tuples = list(zip(*arrays))
        index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second', 'third'])

        df_both = pd.DataFrame(np.random.randn(3, 16), index=['A', 'B', 'C'], columns=index)
        widget = PerspectiveWidget()
        widget.load(df_both)
        assert widget.columns == [' ']
        assert widget.column_pivots == ['first', 'second', 'third']
        assert widget.row_pivots == ['index']
