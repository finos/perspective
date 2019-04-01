class TestLayout:
    def setup(self):
        pass
        # setup() before each test method

    def test_convert_to_psp_schema(self):
        from perspective.schema import convert_to_psp_schema
        x = {1: 'float', 2: 'integer', 3: 'bool', 4: 'time', 5: 'str'}
        y = {1: 'float', 2: 'integer', 3: 'boolean', 4: 'date', 5: 'string'}
        assert y == convert_to_psp_schema(x)
