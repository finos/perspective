# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from datetime import date, datetime
import pandas as pd
import numpy as np
import lantern as l
from perspective import PerspectiveWidget

DF2 = df = pd.DataFrame([
    {
       'int': 1,
       'float': 1.5,
       'string': '20150505',
       'date': date.today(),
       'datetime': datetime.now(),
       'object': datetime,
    },
    {
       'int': 1,
       'float': 1.5,
       'string': '20150506',
       'date': None,
       'datetime': None,
       'object': None,
    },
])

DF = l.superstore()
LINE = l.line()
CUSTOM_SCHEMA = {'int': 'int', 'float': 'float', 'string': 'date', 'date': 'date', 'datetime': 'date', 'object': 'string'}
CUSTOM_SCHEMA_CONVERTED = {'int': 'integer', 'float': 'float', 'string': 'date', 'date': 'date', 'datetime': 'date', 'object': 'string'}


class TestPandas:
    def setup(self):
        pass

    def test_rowpivots(self):
        # basic
        df_pivoted = DF.set_index(['Country', 'Region'])
        psp = PerspectiveWidget(df_pivoted)
        assert psp.rowpivots == ['Country', 'Region']
        assert psp.columnpivots == []
        assert sorted(psp.columns) == sorted(['Category', 'City', 'Customer ID', 'Discount', 'Order Date', 'Order ID', 'Postal Code',
                                              'Product ID', 'Profit', 'Quantity', 'Row ID', 'Sales', 'Segment', 'Ship Date',
                                              'Ship Mode', 'State', 'Sub-Category'])
        assert psp.schema == {'Country': 'string', 'Region': 'string', 'Category': 'string', 'City': 'string', 'Customer ID': 'string', 'Discount': 'float',
                              'Order Date': 'date', 'Order ID': 'string', 'Postal Code': 'string', 'Product ID': 'string', 'Profit': 'float', 'Quantity': 'integer',
                              'Row ID': 'integer', 'Sales': 'integer', 'Segment': 'string', 'Ship Date': 'date', 'Ship Mode': 'string', 'State': 'string', 'Sub-Category': 'string'}

    def test_pivottable(self):
        pt = pd.pivot_table(DF, values='Discount', index=['Country', 'Region'], columns='Category')
        psp = PerspectiveWidget(pt)
        assert psp.rowpivots == ['Country', 'Region']
        assert psp.columnpivots == []
        assert psp.columns == ['Consumer Discretionary', 'Consumer Staples', 'Energy', 'Financials',
                               'Health Care', 'Industrials', 'Information Technology', 'Materials', 'Real Estate', 'Telecommunication Services', 'Utilities']
        assert psp.schema == {'Country': 'string', 'Region': 'string', 'Consumer Discretionary': 'float', 'Consumer Staples': 'float', 'Energy': 'float', 'Financials': 'float',
                              'Health Care': 'float', 'Industrials': 'float', 'Information Technology': 'float', 'Materials': 'float', 'Real Estate': 'float',
                              'Telecommunication Services': 'float', 'Utilities': 'float'}

    def test_colpivots(self):
        arrays = [np.array(['bar', 'bar', 'bar', 'bar', 'baz', 'baz', 'baz', 'baz', 'foo', 'foo', 'foo', 'foo', 'qux', 'qux', 'qux', 'qux']),
                  np.array(['one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two']),
                  np.array(['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'])]
        tuples = list(zip(*arrays))
        index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second', 'third'])

        df_both = pd.DataFrame(np.random.randn(3, 16), index=['A', 'B', 'C'], columns=index)
        psp = PerspectiveWidget(df_both)
        assert psp.columns == [' ']
        assert psp.columnpivots == ['first', 'second', 'third']
        assert psp.rowpivots == ['index']
        assert psp.schema == {'first': 'string', 'second': 'string', 'third': 'string', 'index': 'string', ' ': 'float'}

    def test_schema_conversion(self):
        psp = PerspectiveWidget(DF2)
        assert psp.schema == {'index': 'integer', 'date': 'date', 'datetime': 'date', 'float': 'float', 'int': 'integer', 'object': 'string', 'string': 'date'}

    def test_schema_no_ignore(self):
        psp = PerspectiveWidget(DF2, schema=CUSTOM_SCHEMA)
        assert psp.schema == CUSTOM_SCHEMA_CONVERTED
