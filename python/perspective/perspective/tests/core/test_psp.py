# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#


class TestPSP:
    def setup(self):
        pass
        # setup() before each test method

    def test_psp(self):
        import pandas as pd
        from perspective import psp
        df = pd.DataFrame([1, 2], columns=['1'])
        psp(df)
