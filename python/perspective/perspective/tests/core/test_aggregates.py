# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from mock import patch


class TestAggregates:
    def setup(self):
        pass
        # setup() before each test method

    def test_aggregates(self):
        import pandas as pd
        from perspective import psp, View, Aggregate, PSPException
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, View.YBAR, None, ['1'], None, ['1'], {'1': Aggregate.ANY})
            psp(df, View.YBAR, None, ['1'], None, ['1'], {'1': 'any'})
            try:
                psp(df, View.YBAR, None, ['1'], None, ['1'], {'1': 'test'})
                assert False
            except PSPException:
                pass
            try:
                psp(df, View.YBAR, None, ['1'], None, ['1'], {'1': 5})
                assert False
            except PSPException:
                pass
            try:
                psp(df, View.YBAR, None, ['1'], None, ['1'], 5)
                assert False
            except PSPException:
                pass
