# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import string
from datetime import date, datetime
import pandas as pd
import numpy as np
from perspective import PerspectiveWidget
from random import random, randint, choice
from faker import Faker
fake = Faker()


def superstore(count=10):
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


# remove cufflinks dep
def getName(n=1, name=3, exchange=2, columns=None, mode='abc'):
    def get_abc(n):
        def _w(n, base=2):
            _n = 1
            st = []
            while base ** _n <= n:
                _n += 1
            for _ in range(_n-1, 0, -1):
                n_st = n // (base ** _)
                st.append(n_st)
                n = n - n_st * (base ** _)
            st.append(n+1)
            return st
        st = _w(n, len(string.ascii_lowercase))
        _st = ''
        for _ in st:
            _st += string.ascii_lowercase[_-1]
        return _st
    columns = [get_abc(_) for _ in range(n)]
    return columns


# remove cufflinks dep
def lines(n_traces=5, n=100, columns=None, dateIndex=True, mode=None):
    index = pd.date_range('1/1/15', periods=n) if dateIndex else list(range(n))
    df = pd.DataFrame(np.random.randn(n, n_traces), index=index,
                      columns=getName(n_traces, columns=columns, mode=mode))
    return df.cumsum()


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

DF = superstore()
LINE = lines()
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
        assert psp.columns == ['Financials', 'Industrials', 'Technology']
        assert psp.schema == {'Country': 'string', 'Region': 'string', 'Financials': 'float',
                              'Industrials': 'float', 'Technology': 'float'}

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
