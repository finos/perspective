# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import numpy as np
from perspective.table import Table
from random import random, randint, choice
from faker import Faker
fake = Faker()

try:
    import pandas as pd

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

    class TestTableNumpy(object):
        def test_empty_table(self):
            tbl = Table([])
            assert tbl.size() == 0

        def test_table_dataframe(self):
            import pandas as pd
            data = pd.DataFrame([{"a": 1, "b": 2}, {"a": 3, "b": 4}])
            tbl = Table(data)
            assert tbl.size() == 2

        def test_table_series(self):
            import pandas as pd
            data = pd.Series([1, 2, 3], name="a")
            tbl = Table(data)
            assert tbl.size() == 3

        def test_rowpivots(self):
            # basic
            df = superstore()
            df_pivoted = df.set_index(['Country', 'Region'])
            table = Table(df_pivoted)

        def test_pivottable(self):
            df = superstore()
            pt = pd.pivot_table(df, values='Discount', index=['Country', 'Region'], columns='Category')
            table = Table(pt)

        def test_colpivots(self):
            arrays = [np.array(['bar', 'bar', 'bar', 'bar', 'baz', 'baz', 'baz', 'baz', 'foo', 'foo', 'foo', 'foo', 'qux', 'qux', 'qux', 'qux']),
                      np.array(['one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two']),
                      np.array(['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'])]
            tuples = list(zip(*arrays))
            index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second', 'third'])

            df_both = pd.DataFrame(np.random.randn(3, 16), index=['A', 'B', 'C'], columns=index)
            table = Table(df_both)

except (ImportError, ModuleNotFoundError):
    pass
