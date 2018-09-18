import os
import os.path


class TestTable:
    def setup(self):
        pass
        # setup() before each test method

    def test_table(self):
        import numpy as np
        import pandas as pd
        from perspective.table import Perspective

        t = Perspective(['Col1', 'Col2', 'Col3', 'Col4', 'Col5'], [int, str, float, np.int64, np.float64])

        print('\nfrom list of int test:\n')
        t.load('Col1', [1, 2, 3, 4])
        t.print()

        print('\nfrom list of string test:\n')
        t.load('Col2', ["abcd", "defg", "csdf", "dasf"])
        t.print()

        print('\nfrom list of float test:\n')
        t.load('Col3', [1.1, 2.2, 3.3, 4.4])
        t.print()


        print('\nfrom np array of int test:\n')
        arr1 = np.array([1, 2, 3, 4])
        t.load('Col4', arr1)
        t.print()

        print('\nfrom np array of float test:\n')
        arr2 = np.array([1.1, 2.2, 3.3, 4.4])
        t.load('Col5', arr2)
        t.print()

        print('\nprint types:\n')
        print(t['Col1'], type(t['Col1']))
        # print(t['Col2'])
        print(t['Col3'], type(t['Col1']))
        print(t['Col4'], type(t['Col1']))
        print(t['Col5'], type(t['Col1']))

        print()
        print()
        print()
        print()

        print('\nto dataframe test:\n')
        print(t.to_df())

        print('\nfrom dataframe test:\n')
        df = pd.read_csv(os.path.join(os.path.dirname(__file__), 'ohlc.csv'))
        t = Perspective.from_df(df[['open', 'high', 'low', 'close']].head())

        t.print()
