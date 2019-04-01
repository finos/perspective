from mock import patch, MagicMock
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
    def setup(self):
        pass
        # setup() before each test method

    def teardown(self):
        pass
        # teardown() after each test method

    @classmethod
    def setup_class(cls):
        pass
        # setup_class() before any methods in this class

    @classmethod
    def teardown_class(cls):
        pass
        # teardown_class() after any methods in this class

    def test_pandas(self):
        import pandas as pd
        from perspective.data import type_detect

        df = pd.DataFrame([1, 2])
        o = type_detect(df)

        expected = [{"index": 0, 0: 1}, {"index": 1, 0: 2}]
        print(o.data)
        print(expected)
        assert o.data == expected
        assert o.type == 'json'

        # series check
        df = pd.DataFrame([1, 2])
        o = type_detect(df[0])

        expected = [{"index": 0, 0: 1}, {"index": 1, 0: 2}]
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
        from perspective.data import type_detect
        x = [{'1': 'a'}, {'1': 'simple'}, {'1': 'test'}]

        o = type_detect(x)
        print(o.data)
        assert o.data == x
        assert o.type == 'json'

    def test_dict(self):
        from perspective.data import type_detect
        x = {'a': 'simple test'}

        o = type_detect(x)
        print(o.data)
        assert o.data == [{"a": "simple test"}]
        assert o.type == 'json'

    def test_other(self):
        from perspective.data import type_detect
        o = type_detect('test')
        assert o.data == []
        assert o.type == ''
