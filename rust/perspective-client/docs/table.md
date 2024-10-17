[`Table`] is Perspective's columnar data frame, analogous to a Pandas
`DataFrame` or Apache Arrow, supporting append & in-place updates, removal by
index, and update notifications.

A [`Table`] contains columns, each of which have a unique name, are strongly and
consistently typed, and contains rows of data conforming to the column's type.
Each column in a [`Table`] must have the same number of rows, though not every
row must contain data; null-values are used to indicate missing values in the
dataset.

The schema of a [`Table`] is _immutable after creation_, which means the column
names and data types cannot be changed after the [`Table`] has been created.
Columns cannot be added or deleted after creation either, but a [`View`] can be
used to select an arbitrary set of columns from the [`Table`].

<div class="javascript">
<div class="warning">
The examples in this module are in JavaScript. See <a href="https://docs.rs/crate/perspective/latest"><code>perspective</code></a> docs for the Rust API.
</div>
</div>
<div class="python">
<div class="warning">
The examples in this module are in Python. See <a href="https://docs.rs/crate/perspective/latest"><code>perspective</code></a> docs for the Rust API.
</div>
</div>

## Schema and Types

The mapping of a `Table`'s column names to data types is referred to as a
`schema`. Each column has a unique name and a single data type:

<div class="javascript">

```javascript
var schema = {
    x: "integer",
    y: "string",
    z: "boolean",
};

const table2 = await worker.table(schema);
```

</div>
<div class="python">

```python
from datetime import date, datetime

schema = {
    "x": "integer",
    "y": "string",
    "z": "boolean",
}

table2 = perspective.Table(schema)
```

</div>
<div class="rust">

```rust
let data = TableData::Schema(vec![(" a".to_string(), ColumnType::FLOAT)]);
let options = TableInitOptions::default();
let table = client.table(data.into(), options).await?;
```

</div>

When passing data directly to the [`crate::Client::table`] constructor, the type
of each column is inferred automatically. In some cases, the inference algorithm
may not return exactly what you'd like. For example, a column may be interpreted
as a `datetime` when you intended it to be a `string`, or a column may have no
values at all (yet), as it will be updated with values from a real-time data
source later on. In these cases, create a `table()` with a _schema_.

Once the [`Table`] has been created with a schema, further `update()` calls will
no longer perform type inference, so columns must only include values supported
by the column's [`ColumnType`].

## Data Formats

A [`Table`] may also be created-or-updated by data in CSV,
[Apache Arrow](https://arrow.apache.org/), JSON row-oriented or JSON
column-oriented formats.

<div class="python">

In addition to these core formats, `perspective-python` additionally supports
`pyarrow.Table` and `pandas.DataFrame` objects directly. These formats are
otherwise identical to the built-in formats and don't exhibit any additional
support or type-awareness; e.g., `pandas.DataFrame` support is _just_
`pyarrow.Table.from_pandas` piped into Perspective's Arrow reader.

</div>

[`crate::Client::table`] and [`Table::update`] perform _coercion_ on their input
for all input formats _except_ Arrow (which comes with its own schema and has no
need for coercion).

`"date"` and `"datetime"` column types do not have native JSON representations,
so these column types _cannot_ be inferred from JSON input. Instead, for columns
of these types for JSON input, a [`Table`] must first be constructed with a
_schema_. Next, call [`Table::update`] with the JSON input - Perspective's JSON
reader may _coerce_ a `date` or `datetime` from these native JSON types:

-   `integer` as milliseconds-since-epoch.
-   `string` as a any of Perspective's built-in date format formats.
-   JavaScript `Date` and Python `datetime.date` and `datetime.datetime` are
    _not_ supported directly. However, in JavaScript `Date` types are
    automatically coerced to correct `integer` timestamps by default when
    converted to JSON.

For CSV input types, Perspective relies on Apache Arrow's CSV parser, and as
such uses the same column-type inference logic as Arrow itself.

## Index and Limit

Initializing a [`Table`] with an `index` tells Perspective to treat a column as
the primary key, allowing in-place updates of rows. Only a single column (of any
type) can be used as an `index`. Indexed [`Table`] instances allow:

-   In-place _updates_ whenever a new row shares an `index` values with an
    existing row
-   _Partial updates_ when a data batch omits some column.
-   _Removes_ to delete a row by `index`.

To create an indexed `Table`, provide the `index` property with a string column
name to be used as an index:

<div class="javascript">

```javascript
const indexed_table = await perspective.table(data, { index: "a" });
```

</div>
<div class="javascript">

```python
indexed_table = perspective.Table(data, index="a");
```

</div>

Initializing a [`Table`] with a `limit` sets the total number of rows the
[`Table`] is allowed to have. When the [`Table`] is updated, and the resulting
size of the [`Table`] would exceed its `limit`, rows that exceed `limit`
overwrite the oldest rows in the [`Table`]. To create a [`Table`] with a
`limit`, provide the `limit` property with an integer indicating the maximum
rows:

<div class="javascript">

```javascript
const limit_table = await perspective.table(data, { limit: 1000 });
```

</div>
<div class="python">

```python
limit_table = perspective.Table(data, limit=1000);
```

</div>

## [`Table::update`] and [`Table::remove`]

Once a [`Table`] has been created, it can be updated with new data conforming to
the [`Table`]'s schema. [`Table::update`] supports the same data formats as
[`crate::Client::table`], minus _schema_.

<div class="javascript">

```javascript
const schema = {
    a: "integer",
    b: "float",
};

const table = await perspective.table(schema);
table.update(new_data);
```

</div>
<div class="python">

```python
schema = {"a": "integer", "b": "float"}

table = perspective.Table(schema)
table.update(new_data)
```

</div>

Without an `index` set, calls to `update()` _append_ new data to the end of the
`Table`. Otherwise, Perspective allows
[_partial updates_ (in-place)](#index-and-limit) using the `index` to determine
which rows to update:

<div class="javascript">

```javascript
indexed_table.update({ id: [1, 4], name: ["x", "y"] });
```

</div>
<div class="python">

```python
indexed_table.update({"id": [1, 4], "name": ["x", "y"]})
```

</div>

Any value on a [`Client::table`] can be unset using the value `null` in JSON or
Arrow input formats. Values may be unset on construction, as any `null` in the
dataset will be treated as an unset value. [`Table::update`] calls do not need
to provide _all columns_ in the [`Table`]'s schema; missing columns will be
omitted from the [`Table`]'s updated rows.

<div class="javascript">

```javascript
table.update([{ x: 3, y: null }]); // `z` missing
```

</div>
<div class="python">

```python
table.update([{"x": 3, "y": None}]) // `z` missing
```

</div>

Rows can also be removed from an indexed [`Table`], by calling [`Table::remove`]
with an array of index values:

<div class="javascript">

```javascript
indexed_table.remove([1, 4]);
```

</div>
<div class="python">

```python
indexed_table.remove([1, 4])
```

</div>

# [`Table::clear`] and [`Table::replace`]

Calling [`Table::clear`] will remove all data from the underlying [`Table`].
Calling [`Table::replace`] with new data will clear the [`Table`], and update it
with a new dataset that conforms to Perspective's data types and the existing
schema on the `Table`.

<div class="javascript">

```javascript
table.clear();
table.replace(json);
```

</div>
<div class="python">

```python
table.clear()
table.replace(df)
```

</div>

<div class="warning">`limit` cannot be used in conjunction with `index`.</div>
