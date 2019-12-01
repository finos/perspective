################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import pandas as pd
from mock import patch
from perspective import PerspectiveWidget, Plugin, PerspectiveError


class TestLayout:

    def test_layout_invalid_plugin(self):
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            PerspectiveWidget(df, plugin=Plugin.YBAR)
            PerspectiveWidget(df, plugin='y_line')
            try:
                PerspectiveWidget(df, plugin='test')
                assert False
            except PerspectiveError:
                pass

            try:
                PerspectiveWidget(df, plugin=5)
                assert False
            except PerspectiveError:
                pass

    def test_layout_invalid_columns(self):
        with patch('IPython.display.display'):
            df = pd.DataFrame([1, 2], columns=['1'])
            PerspectiveWidget(df, plugin=Plugin.YBAR, columns=['1'])
            try:
                PerspectiveWidget(df, plugin=Plugin.YBAR, columns=5)
                assert False
            except PerspectiveError:
                pass
