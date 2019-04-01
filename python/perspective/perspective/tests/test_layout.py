from mock import patch


class TestLayout:
    def setup(self):
        pass
        # setup() before each test method

    def test_layout(self):
        import pandas as pd
        from perspective import psp, View, PSPException
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, View.YBAR)
            psp(df, 'y_line')
            try:
                psp(df, 'test')
                assert False
            except PSPException:
                pass

            try:
                psp(df, 5)
                assert False
            except PSPException:
                pass

    def test_layout2(self):
        import pandas as pd
        from perspective import psp, View, PSPException
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, View.YBAR, None, '1')
            psp(df, View.YBAR, None, ['1'])
            try:
                psp(df, View.YBAR, None, 5)
                assert False
            except PSPException:
                pass

    def test_layout3(self):
        import pandas as pd
        from perspective import psp, View
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, View.YBAR, None, '1')
            psp(df, View.YBAR, None, ['1'])
            psp(df, View.YBAR, None, ['1'], '1')
            psp(df, View.YBAR, None, ['1'], ['1'])

    def test_layout4(self):
        import pandas as pd
        from perspective import psp, View
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, View.YBAR, None, ['1'])
            psp(df, View.YBAR, None, ['1'], None, ['1'])
            psp(df, View.YBAR, None, ['1'], None, '1')

    def test_layout5(self):
        import pandas as pd
        from perspective import psp, View, PSPException
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, View.YBAR, None, ['1'])
            psp(df, View.YBAR, None, ['1'], None, None, None, [['test', 'asc']])
            try:
                psp(df, View.YBAR, None, ['1'], None, None, None, 5)
                assert False
            except PSPException:
                pass
