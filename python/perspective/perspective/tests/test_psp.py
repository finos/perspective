

class TestPSP:
    def setup(self):
        pass
        # setup() before each test method

    def test_psp(self):
        import pandas as pd
        from perspective import psp
        df = pd.DataFrame([1, 2], columns=['1'])
        psp(df)
