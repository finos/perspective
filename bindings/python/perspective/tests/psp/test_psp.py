from mock import patch


class TestPSP:
    def setup(self):
        pass
        # setup() before each test method

    def test_psp(self):
        import pandas as pd
        from perspective import psp
        with patch('IPython.display.display') as m1:
            df = pd.DataFrame([1, 2], columns=['1'])
            psp(df)
            assert m1.call_count == 1
