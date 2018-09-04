from mock import patch, MagicMock
from datetime import datetime


class Nope(object):
    @property
    def DataFrame(self):
        raise ImportError

    @property
    def LanternLive(self):
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
        import json
        from perspective._type import type_detect

        df = pd.DataFrame([1, 2])
        t, _, x = type_detect(df, True)

        expected = json.dumps([{"index": 0, "0": 1}, {"index": 1, "0": 2}])
        print(x)
        print(expected)
        assert json.loads(x) == json.loads(expected)
        assert t == 'pandas'

        # series check
        df = pd.DataFrame([1, 2])
        t, _, x = type_detect(df[0], True)

        expected = json.dumps([{"index": 0, "0": 1}, {"index": 1, "0": 2}])
        print(x)
        print(expected)
        assert json.loads(x) == json.loads(expected)
        assert t == 'pandas'

        df = pd.DataFrame([[1, 2]], columns=['1', '2'], index=[datetime.today(), datetime.today()])
        t, _, x = type_detect(df, True)
        assert t == 'pandas'

        import sys
        sys.modules['pandas'] = Nope()
        type_detect('test', True)
        sys.modules['pandas'] = pd

    def test_lantern(self):
        class Test(object):
            def __init__(self):
                pass

            def path(self):
                return 'test'

        module_mock = MagicMock()
        with patch.dict('sys.modules', **{
                'lantern': module_mock,
                'lantern.live': module_mock,
                }):
            module_mock.LanternLive = Test
            from perspective._type import type_detect

            t, _, x = type_detect(Test(), True)

            assert x == 'test'
            assert t == 'lantern'

            import sys
            sys.modules['lantern'] = Nope()
            type_detect('test')

    def test_list(self):
        from perspective._type import type_detect
        x = ['a', 'simple', 'test']

        t, _, y = type_detect(x, True)
        print(y)
        assert y == '["a", "simple", "test"]'
        assert t == 'list'

    def test_dict(self):
        from perspective._type import type_detect
        x = {'a': 'simple test'}

        t, _, y = type_detect(x, True)
        print(y)
        assert y == '[{"a": "simple test"}]'
        assert t == 'dict'

    def test_webroutes(self):
        from perspective._type import type_detect
        x = ['https://', 'http://', 'wss://', 'ws://', 'sio://']
        for val in x:
            assert val + 'test' == type_detect(val + 'test', True)[2]

    def test_other(self):
        from perspective._type import type_detect
        t, _, x = type_detect('test', True)
        assert x == 'test'
        assert t == ''
