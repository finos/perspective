# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from mock import patch


class TestLayout:
    def setup(self):
        pass
        # setup() before each test method

    def test_layout(self):
        import pandas as pd
        from perspective import psp, Plugin, PerspectiveError
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, Plugin.YBAR)
            psp(df, 'y_line')
            try:
                psp(df, 'test')
                assert False
            except PerspectiveError:
                pass

            try:
                psp(df, 5)
                assert False
            except PerspectiveError:
                pass

    def test_layout2(self):
        import pandas as pd
        from perspective import psp, Plugin, PerspectiveError
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, Plugin.YBAR, None, '1')
            psp(df, Plugin.YBAR, None, ['1'])
            try:
                psp(df, Plugin.YBAR, None, 5)
                assert False
            except PerspectiveError:
                pass

    def test_layout3(self):
        import pandas as pd
        from perspective import psp, Plugin
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, Plugin.YBAR, None, '1')
            psp(df, Plugin.YBAR, None, ['1'])
            psp(df, Plugin.YBAR, None, ['1'], '1')
            psp(df, Plugin.YBAR, None, ['1'], ['1'])

    def test_layout4(self):
        import pandas as pd
        from perspective import psp, Plugin
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, Plugin.YBAR, None, ['1'])
            psp(df, Plugin.YBAR, None, ['1'], None, ['1'])
            psp(df, Plugin.YBAR, None, ['1'], None, '1')

    def test_layout5(self):
        import pandas as pd
        from perspective import psp, Plugin, PerspectiveError
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df, Plugin.YBAR, None, ['1'])
            psp(df, Plugin.YBAR, None, ['1'], None, None, None, [['test', 'asc']])
            try:
                psp(df, Plugin.YBAR, None, ['1'], None, None, None, 5)
                assert False
            except PerspectiveError:
                pass
