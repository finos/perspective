from perspective import Table
import os.path
import pyarrow as pa
FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "examples", "simple", "date32.arrow")

with open(FILE_PATH, mode='rb') as file:  # b is important -> binary
    tbl = Table(file.read())
    v = tbl.view(row_pivots=["a"])
    array = v.to_arrow()
    # print(type(array))
    # print(str(array, "utf-8", "replace"))

    file_contents = pa.BufferReader(array)
    reader = pa.ipc.open_stream(file_contents)
    result = reader.read_pandas()

    tbl2 = Table(array)
    print("Successful transit!")
    print(tbl2.schema())

    data = tbl2.view().to_df()
    print(data)
