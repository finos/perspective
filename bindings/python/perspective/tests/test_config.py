
class TestConfig:
    def setup(self):
        pass
        # setup() before each test method

    def test_config(self):
        from perspective._config import config
        assert config('', None) == '{}'
        assert config('{}', 'test') == '{}'
        assert config({}, 'http://') == '{"field": "", "records": false, "repeat": 10}'
        assert config({}, 'https://') == '{"field": "", "records": false, "repeat": 10}'
        assert config({}, 'ws://') == '{"send": "{}", "records": false}'
        assert config({}, 'wss://') == '{"send": "{}", "records": false}'
        assert config({}, 'sio://') == '{"channel": "", "records": false}'
