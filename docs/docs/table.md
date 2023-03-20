---
id: table
title: Table
---

import Tabs from '@theme/Tabs'; import TabItem from '@theme/TabItem';

The `Table` is Perspective's columnar data frame, analogous to a Pandas
`DataFrame` or Apache Arrow. `Table` supports appending data, in-place updates,
removal by index, and notifications on update.

A `Table` contains columns, each of which have a unique name, are strongly and
consistently typed, and contains rows of data conforming to the column's type.
Each column in a `Table` must have the same number of rows, though not every row
must contain data; null-values are used to indicate missing values in the
dataset.

The columns of a `Table` are _immutable after creation_, which means their names
and data types cannot be changed after the `Table` has been created. Columns
cannot be added or deleted after creation, but a `View` can be used to select an
arbitrary set of columns from the `Table`.

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
var data = [
    { x: 1, y: "a", z: true },
    { x: 2, y: "b", z: false },
    { x: 3, y: "c", z: true },
    { x: 4, y: "d", z: false },
];

const table1 = await worker.table(data);
```

</TabItem>
<TabItem value="python" label="Python">

```python
data = [
    {"x": 1, "y": "a", "z": True},
    {"x": 2, "y": "b", "z": False},
    {"x": 3, "y": "c", "z": True},
    {"x": 4, "y": "d", "z": False}
];

table1 = perspective.Table(data)
```

</TabItem>
</Tabs>

## Schema and Types

The mapping of a `Table`'s column names to data types is referred to as a
`schema`. Each column has a unique name and a single data type, and data types
are expressed with a common vocabulary of across all supported host languages.
In Python, you may alternatively use native types over their String
counterparts:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
var schema = {
    x: "integer",
    y: "string",
    z: "boolean",
};

const table2 = await worker.table(schema);
```

</TabItem>
<TabItem value="python" label="Python">

```python
from datetime import date, datetime

schema = {
    "a": int,
    "b": float,
    "c": date,
    "d": datetime,
    "e": bool,
    "f": str
}

table2 = perspective.Table(schema)
```

</TabItem>
</Tabs>

When passing data directly to the `table()` constructor, the type of each column
is inferred automatically. In some cases, the inference algorithm may not return
exactly what you'd like. For example, a column may be interpreted as a
`datetime` when you intended it to be a `string`, or a column may have no values
at all (yet), as it will be updated with values from a real-time data source
later on. In these cases, create a `table()` with a _schema_.

Once the `Table` has been created with a schema, further `update()` calls will
conver data types to conform with the schema; a column that is typed as a
`datetime`, for example, can be updated with `date` objects, `datetime` objects,
`pandas.Timestamp`, `numpy.datetime64`, and even valid millisecond/seconds from
epoch timestamps. Similarly, updating string columns with integer data will
cause a cast to string, updating floats with ints will cast to float, and etc.
Type conversion can also leverage Python converters, such as `__int__`,
`__float__`, etc.

## Index and Limit

Initializing a `Table` with an `index` tells Perspective to treat a column as
the primary key, allowing in-place updates of rows. Only a single column (of any
type) can be used as an `index`. Indexed `Table` instances allow:

-   In-place _updates_ whenever a new row shares an `index` values with an
    existing row
-   _Partial updates_ when such a row leaves some column values `undefined`
-   _Removes_ to delete a row by `index`.

To create an indexed `Table`, provide the `index` property with a string column
name to be used as an index:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const indexed_table = await perspective.table(data, { index: "a" });
```

</TabItem>
<TabItem value="python" label="Python">

```python
indexed_table = perspective.Table(data, index="a");
```

</TabItem>
</Tabs>

Initializing a `Table` with a `limit` sets the total number of rows the `Table`
is allowed to have. When the `Table` is updated, and the resulting size of the
`Table` would exceed its `limit`, rows that exceed `limit` overwrite the oldest
rows in the `Table`. To create a `Table` with a `limit`, provide the `limit`
property with an integer indicating the maximum rows:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const limit_table = await perspective.table(data, { limit: 1000 });
```

</TabItem>
<TabItem value="python" label="Python">

```python
limit_table = perspective.Table(data, limit=1000);
```

</TabItem>
</Tabs>

> `limit` cannot be used in conjunction with `index`.

## Update and Remove

Once a `Table` has been created, it can be updated with new data conforming to
the `Table`'s `schema`. The dataset used for `update()` must conform with the
formats supported by Perspective.

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
const schema = {
    a: "integer",
    b: "float",
};

const table = await perspective.table(schema);
table.update(new_data);
```

</TabItem>
<TabItem value="python" label="Python">

```python
schema = {"a": int, "b": float}

table = perspective.Table(schema)
table.update(new_data)
```

</TabItem>
</Tabs>

Without an `index` set, calls to `update()` _append_ new data to the end of the
`Table`. Otherwise, Perspective allows
[_partial updates_ (in-place)](#index-and-limit) using the `index` to determine
which rows to update:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
indexed_table.update({ id: [1, 4], name: ["x", "y"] });
```

</TabItem>
<TabItem value="python" label="Python">

```python
indexed_table.update({"id": [1, 4], "name": ["x", "y"]})
```

</TabItem>
</Tabs>

Any value on a `table()` can be unset using the value `null` (Javascript) or
`None` (Python). Values may be unset on construction, as any `null` in the
dataset will be treated as an unset value, and can be explicitly unset via
`update()` on a `table()` with `index` applied. `update()` calls do not need
values for _all columns_ in the `table()` schema; Missing keys (or keys with
values set to `undefined` in Javascript), will be omitted from `table()`s with
`index` set, and become `null`:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
table.update([{ x: 3, y: null }]); // `z` missing
```

</TabItem>
<TabItem value="python" label="Python">

```python
table.update([{"x": 3, "y": None}]) // `z` missing
```

</TabItem>
</Tabs>

Rows can also be removed from an indexed `Table`, with an array of primary keys:

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
indexed_table.remove([1, 4]);
```

</TabItem>
<TabItem value="python" label="Python">

```python
indexed_table.remove([1, 4])
```

</TabItem>
</Tabs>

Calling `clear()` will remove all data from the underlying `Table`. Calling
`replace(data)` with new data will clear the `Table`, and update it with a new
dataset that conforms to Perspective's data types and the existing schema on the
`Table`.

<Tabs>
<TabItem value="js" label="JavaScript">

```javascript
table.clear();
table.replace(json);
```

</TabItem>
<TabItem value="python" label="Python">

```python
table.clear()
table.replace(df2)
```

</TabItem>
</Tabs>
