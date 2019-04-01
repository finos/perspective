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
