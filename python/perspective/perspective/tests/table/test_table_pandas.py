# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from io import StringIO
from datetime import date, datetime
import numpy as np
from perspective.table import Table
from random import random, randint, choice
from faker import Faker
import pandas as pd
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


class TestTablePandas(object):
    def test_empty_table(self):
        tbl = Table([])
        assert tbl.size() == 0

    def test_table_dataframe(self):
        data = pd.DataFrame([{"a": 1, "b": 2}, {"a": 3, "b": 4}])
        tbl = Table(data)
        assert tbl.size() == 2

    def test_table_read_nan_int_col(self):
        data = pd.DataFrame({"str": ["abc", float("nan"), "def"], "int": [np.nan, 1, 2]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "int": float  # np.nan is float type - ints convert to floats when filled in
        }
        assert tbl.size() == 3
        assert tbl.view().to_dict() == {
            "index": [0, 1, 2],
            "str": ["abc", None, "def"],
            "int": [None, 1.0, 2.0]
        }

    def test_table_read_nan_float_col(self):
        data = pd.DataFrame({"str": [float("nan"), "abc", float("nan")], "float": [np.nan, 1.5, 2.5]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "float": float  # can only promote to string or float
        }
        assert tbl.size() == 3
        assert tbl.view().to_dict() == {
            "index": [0, 1, 2],
            "str": [None, "abc", None],
            "float": [None, 1.5, 2.5]
        }

    def test_table_read_nan_bool_col(self):
        data = pd.DataFrame({"bool": [float("nan"), True, float("nan")], "bool2": [False, float("nan"), True]})
        tbl = Table(data)
        # if np.nan begins a column, it is inferred as float and then can be promoted. if np.nan is in the values (but not at start), the column type is whatever is inferred.
        assert tbl.schema() == {
            "index": int,
            "bool": str,
            "bool2": bool
        }
        assert tbl.size() == 3
        # np.nans are always serialized as None
        assert tbl.view().to_dict() == {
            "index": [0, 1, 2],
            "bool": [None, "True", None],
            "bool2": [False, None, True]
        }

    def test_table_read_nan_date_col(self):
        data = pd.DataFrame({"str": ["abc", "def"], "date": [float("nan"), date(2019, 7, 11)]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "date": str  # can only promote to string or float
        }
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "date": [None, '2019-07-11']
        }

    def test_table_read_nan_datetime_col(self):
        data = pd.DataFrame({"str": ["abc", "def"], "datetime": [float("nan"), datetime(2019, 7, 11, 11, 0)]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "datetime": datetime  # can only promote to string or float
        }
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, datetime(2019, 7, 11, 11, 0)]
        }

    def test_table_read_nan_datetime_as_date_col(self):
        data = pd.DataFrame({"str": ["abc", "def"], "datetime": [float("nan"), datetime(2019, 7, 11)]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "datetime": datetime  # can only promote to string or float
        }
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, datetime(2019, 7, 11)]
        }

    def test_table_read_nan_datetime_no_seconds(self):
        data = pd.DataFrame({"str": ["abc", "def"], "datetime": [float("nan"), datetime(2019, 7, 11, 11, 0)]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "datetime": datetime  # can only promote to string or float
        }
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, datetime(2019, 7, 11, 11, 0)]
        }

    def test_table_read_nan_datetime_milliseconds(self):
        data = pd.DataFrame({"str": ["abc", "def"], "datetime": [np.nan, datetime(2019, 7, 11, 10, 30, 55)]})
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "datetime": datetime  # can only promote to string or float
        }
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {
            "index": [0, 1],
            "str": ["abc", "def"],
            "datetime": [None, datetime(2019, 7, 11, 10, 30, 55)]
        }

    def test_table_correct_csv_nan_end(self):
        csv = StringIO("str,int\n,1\n,2\nabc,3")
        data = pd.read_csv(csv)
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "int": int
        }
        assert tbl.size() == 3
        assert tbl.view().to_dict() == {
            "index": [0, 1, 2],
            "str": [None, None, "abc"],
            "int": [1, 2, 3]
        }

    def test_table_correct_csv_nan_intermittent(self):
        csv = StringIO("str,float\nabc,\n,2\nghi,")
        data = pd.read_csv(csv)
        tbl = Table(data)
        assert tbl.schema() == {
            "index": int,
            "str": str,
            "float": float
        }
        assert tbl.size() == 3
        assert tbl.view().to_dict() == {
            "index": [0, 1, 2],
            "str": ["abc", None, "ghi"],
            "float": [None, 2, None]
        }

    def test_table_series(self):
        import pandas as pd
        data = pd.Series([1, 2, 3], name="a")
        tbl = Table(data)
        assert tbl.size() == 3

    def test_table_indexed_series(self):
        import pandas as pd
        data = pd.Series([1, 2, 3], index=["a", "b", "c"], name="a")
        tbl = Table(data)
        assert tbl.schema() == {
            "index": str,
            "a": int
        }
        assert tbl.size() == 3

    def test_rowpivots(self):
        df = superstore()
        df_pivoted = df.set_index(['Country', 'Region'])
        table = Table(df_pivoted)
        columns = table.columns()
        assert table.size() == 10
        assert "Country" in columns
        assert "Region" in columns

    def test_pivottable(self):
        df = superstore()
        pt = pd.pivot_table(df, values='Discount', index=['Country', 'Region'], columns='Category')
        table = Table(pt)
        columns = table.columns()
        assert "Country" in columns
        assert "Region" in columns

    def test_colpivots(self):
        arrays = [np.array(['bar', 'bar', 'bar', 'bar', 'baz', 'baz', 'baz', 'baz', 'foo', 'foo', 'foo', 'foo', 'qux', 'qux', 'qux', 'qux']),
                  np.array(['one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two', 'one', 'one', 'two', 'two']),
                  np.array(['X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y', 'X', 'Y'])]
        tuples = list(zip(*arrays))
        index = pd.MultiIndex.from_tuples(tuples, names=['first', 'second', 'third'])

        df_both = pd.DataFrame(np.random.randn(3, 16), index=['A', 'B', 'C'], columns=index)
        table = Table(df_both)
        assert table.size() == 48
