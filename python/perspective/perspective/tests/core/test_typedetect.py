# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from datetime import datetime


class Nope(object):
    @property
    def DataFrame(self):
        raise ImportError

    @property
    def Array(self):
        raise ImportError

    @property
    def Buffer(self):
        raise ImportError


class TestTypedetect:
    def test_pandas(self):
        import pandas as pd
        from perspective.core.data import type_detect

        df = pd.DataFrame([1, 2])
        o = type_detect(df)

        expected = {0: [1, 2], 'index': [0, 1]}
        print(o.data)
        print(expected)
        assert o.data == expected
        assert o.type == 'json'

        # series check
        df = pd.DataFrame([1, 2])
        o = type_detect(df[0])

        expected = {0: [1, 2], 'index': [0, 1]}
        print(o.data)
        print(expected)
        assert o.data == expected
        assert o.type == 'json'

        df = pd.DataFrame([[1, 2]], columns=['1', '2'], index=[datetime.today(), datetime.today()])
        o = type_detect(df)
        assert o.type == 'json'

        import sys
        sys.modules['pandas'] = Nope()
        type_detect('test')
        sys.modules['pandas'] = pd

    def test_list(self):
        from perspective.core.data import type_detect
        x = [{'1': 'a'}, {'1': 'simple'}, {'1': 'test'}]

        o = type_detect(x)
        print(o.data)
        assert o.data == x
        assert o.type == 'json'

    def test_dict(self):
        from perspective.core.data import type_detect
        x = {'a': 'simple test'}

        o = type_detect(x)
        print(o.data)
        assert o.data == [{"a": "simple test"}]
        assert o.type == 'json'

    def test_other(self):
        from perspective.core.data import type_detect
        o = type_detect('test')
        assert o.data == []
        assert o.type == ''
