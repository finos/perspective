from perspective.table import Table
import os.path

FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "examples", "simple", "superstore.arrow")

class TestTableArrow(object):
   
    def test_table_arrow(self):
        with open(FILE_PATH, mode='rb') as file: # b is important -> binary
            tbl = Table(file.read())
            assert tbl.size() == 9994
