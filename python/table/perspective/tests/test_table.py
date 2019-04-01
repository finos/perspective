# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import os
import os.path
import numpy as np
import pandas as pd
from perspective.table import Perspective


class TestTable(object):
    def setUp(self):
        self.t = Perspective(['Col1', 'Col2', 'Col3', 'Col4', 'Col5'], [int, str, float, np.int64, np.float64])

    def test_table(self):
        print('\nfrom list of int test:\n')
        self.t.load('Col1', [1, 2, 3, 4])
        self.t.print()

    def test_table2(self):
        print('\nfrom list of string test:\n')
        self.t.load('Col2', ["abcd", "defg", "csdf", "dasf"])
        self.t.print()

    def test_table3(self):
        print('\nfrom list of float test:\n')
        self.t.load('Col3', [1.1, 2.2, 3.3, 4.4])
        self.t.print()

    def test_table4(self):
        print('\nfrom np array of int test:\n')
        arr1 = np.array([1, 2, 3, 4])
        self.t.load('Col4', arr1)
        self.t.print()

    def test_table5(self):
        print('\nfrom np array of float test:\n')
        arr2 = np.array([1.1, 2.2, 3.3, 4.4])
        self.t.load('Col5', arr2)
        self.t.print()

    def test_table6(self):
        print('\nprint types:\n')
        print(self.t['Col1'], type(self.t['Col1']))
        # print(self.t['Col2'])
        print(self.t['Col3'], type(self.t['Col1']))
        print(self.t['Col4'], type(self.t['Col1']))
        print(self.t['Col5'], type(self.t['Col1']))

    def test_table_to_df(self):
        self.t.load('Col1', [1, 2, 3, 4])
        self.t.load('Col2', ["abcd", "defg", "csdf", "dasf"])
        self.t.load('Col3', [1.1, 2.2, 3.3, 4.4])
        arr1 = np.array([1, 2, 3, 4])
        self.t.load('Col4', arr1)
        arr2 = np.array([1.1, 2.2, 3.3, 4.4])
        self.t.load('Col5', arr2)

        print('\nto dataframe test:\n')
        print(self.t.to_df())

    def test_table_from_df(self):
        print('\nfrom dataframe test:\n')
        file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'test_data', 'ohlc.csv'))

        if os.path.exists(file):
            df = pd.read_csv(file)
            t = Perspective.from_df(df[['open', 'high', 'low', 'close']].head())
            t.print()
        else:
            print('cannot fine ohlc file')
            assert False
