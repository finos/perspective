# Loading data into a Table

A `Table` can be created from a dataset or a schema, the specifics of which are
[discussed](#loading-data-with-table) in the JavaScript section of the user's
guide. In Python, however, Perspective supports additional data types that are
commonly used when processing data:

-   `pandas.DataFrame`
-   `polars.DataFrame`
-   `bytes` (encoding an Apache Arrow)
-   `objects` (either extracting a repr or via reference)
-   `str` (encoding as a CSV)

A `Table` is created in a similar fashion to its JavaScript equivalent:

```python
from datetime import date, datetime
import numpy as np
import pandas as pd
import perspective

data = pd.DataFrame({
    "int": np.arange(100),
    "float": [i * 1.5 for i in range(100)],
    "bool": [True for i in range(100)],
    "date": [date.today() for i in range(100)],
    "datetime": [datetime.now() for i in range(100)],
    "string": [str(i) for i in range(100)]
})

table = perspective.table(data, index="float")
```

Likewise, a `View` can be created via the `view()` method:

```python
view = table.view(group_by=["float"], filter=[["bool", "==", True]])
column_data = view.to_columns()
row_data = view.to_json()
```

## Polars Support

Polars `DataFrame` types work similarly to Apache Arrow input, which Perspective
uses to interface with Polars.

```python
df = polars.DataFrame({"a": [1,2,3,4,5]})
table = perspective.table(df)
```

## Pandas Support

Perspective's `Table` can be constructed from `pandas.DataFrame` objects.
Internally, this just uses
[`pyarrow::from_pandas`](https://arrow.apache.org/docs/python/pandas.html),
which dictates behavior of this feature including type support.

If the dataframe does not have an index set, an integer-typed column named
`"index"` is created. If you want to preserve the indexing behavior of the
dataframe passed into Perspective, simply create the `Table` with
`index="index"` as a keyword argument. This tells Perspective to once again
treat the index as a primary key:

```python
data.set_index("datetime")
table = perspective.table(data, index="index")
```

## Time Zone Handling

When parsing `"datetime"` strings, times are assumed _local time_ unless an
explicit timezone offset is parsed. All `"datetime"` columns (regardless of
input time zone) are _output_ to the user as `datetime.datetime` objects in
_local time_ according to the Python runtime.

This behavior is consistent with Perspective's behavior in JavaScript. For more
details, see this in-depth
[explanation](https://github.com/finos/perspective/pull/867) of
`perspective-python` semantics around time zone handling.

```

```
