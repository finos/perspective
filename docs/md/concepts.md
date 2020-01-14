---
id: concepts
title: Conceptual Overview
---

Perspective is designed and built as an _interactive_ visualization
component for _large, real-time_ datasets. It is designed to be fast, intuitive,
and easily composable, making fine-grained analysis possible on any dataset.

## Overview

This document outlines the main concepts behind Perspective:

- [`Table`](#table), Perspective's typed data interface
- [`View`](#view), a query from a `Table` that calculates and returns data

and explains the query options that can be used to create a `View`:

- [`row_pivots`](#row-pivots), splitting the dataset by unique row values
- [`column_pivots`](#column-pivots), splitting the dataset by unique column values
- [`aggregates`](#aggregates), calculations over the dataset such as `sum`, `average`, or `distinct count`
- [`columns`](#columns), specifying the columns the user is interested in seeing
- [`sort`](#sort), ordering the dataset based on a column's values
- [`filter`](#filter), filtering the dataset based on a column's values

For language-specific guidance, API documentation, or quick-start user guides,
use the sidebar to find the documentation for the language of choice. Though
the way these concepts operate in practice may vary slightly across different
languages based on nuance, the concepts documented here hold true across all
implementations of the Perspective library.

## Table

The `Table` is Perspective's data interface, serving as the base on which all
operations can be called.

A `Table` contains columns, each of which have a unique name, are strongly and
consistently typed, and contains rows of data conforming to the column's type.
Each column in a `Table` must have the same number of rows, though not every
row must contain data; null-values are used to indicate missing values in the
dataset.

The columns of a `Table` are _immutable after creation_, which means their names
and data types cannot be changed after the `Table` has been created. Columns
cannot be added or deleted after creation, but a `View` can be used to select
an arbitary set of columns from the `Table`.

The immutability of columns and data types after creation is important, as it
allows Perspective to operate quickly over a large dataset and accumulate data
without additional recalculation.

### Schema and Data Types

The mapping of a `Table`'s column names to data types is referred to as a
`schema`. Each column has a unique name and a single data type:

```javascript
const schema = {
    a: "integer",
    b: "float",
    c: "date",
    d: "datetime",
    e: "boolean",
    f: "string"
}
```

Because Perspective is built in multiple languages, data types must be
expressible in the same way across different languages, both statically and
dynamically typed.

_Strings_ are used to represent the data types supported by Perspective:

- `"integer"`: a 32-bit (or 64-bit depending on platform) integer
- `"float"`: a 64-bit float
- `"boolean"`: a boolean value of true or false
- `"date"`: a date containing year, month, and day
- `"datetime"`: a datetime containing year, month, day, hour, minute, second, and microsecond
- `"string"`: a unicode string without any character limits

Implementations of these data types will differ slightly based on language and
platform. For example, "integer" in Perspective's Javascript library will always
be 32-bit, whereas an "integer" in Perspective's Python library is 32-bit in
Python 2, and 64-bit in Python 3.

Additionally, if a defined type system is provided (that differentiates between
integers and floats, as well as date and datetimes), Perspective allows the
usage of type instances in the place of strings, such as in Python:

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
```

### Constructing a `Table`

`Table`s are constructed with either a dataset or a
[`schema`](#schema-and-data-types). If a dataset is provided, Perspective reads
the dataset and _infers_ a schema. When exact conformity to data types is
necessary, always construct the `Table` using a schema.

#### Data Formats

`Table`s accept data in row or columnar orientation.

A _row-oriented_ dataset is an array where each element is a dictionary with
string column names as keys, and values that conform to the _data type_ of
the column:

```javascript
data = [
    {"a": 100, "b": 0.25, "c": new Date()},
    {"a": 200, "b": 0.5, "c": new Date()}
]
```

Rows should be consistent, with no additional or missing columns between each
row.

A _column oriented_ dataset is a dictionary where each key is a string column
name, and each element is an array containing values that conform to the
_data type_ of the column:

```javascript
data = {
    "a": [100, 200, 300],
    "b": [0.25, 0.5, 0.75],
    "c": [new Date(), new Date(), new Date()]
}
```

Each array in a column oriented dataset should be of equal length, and each
element inside it should be of the same type.

### Limit

Initializing a `Table` with a `limit` sets a limitation on the total number of
rows the `Table` can have. When the `Table` is updated, and the resulting size of
the `Table` would exceed its `limit`, rows that exceed `limit` overwrite old
rows starting at row 0.

To create a `Table` with a `limit`, provide the `limit` property with an integer
indicating the `limit`:

```javascript
const table = perspective.table(data, {limit: 1000})
```

`limit` cannot be used in conjunction with `index`.

### Index

Initializing a `Table` with an `index` allows Perspective to treat a column as
the primary key, automatically sorting each row by ascending order of the
primary key, and eliminating duplicate values in the primary key column. Only a
single column can be used as an `index`, and it cannot be changed or removed
after the creation of the `Table`. A column of any type may be used as an
`index`.

To create an indexed `Table`, provide the `index` property with a string column
name to be used as an index:

```javascript
const table = perspective.table(data, {index: "a"})
```

An indexed `Table` allows for _partial update_ and _remove_ operations, as
explained in the next section.

### Update

Once a `Table` has been created, it can be updated with new data conforming to
the `Table`'s `schema`. The dataset used for `update` must conform with the
formats supported by Perspective, and cannot be a `schema` (as the `schema`
is immutable).

If a `Table` was initialized with a `schema` instead of a dataset, use `update`
to fill the `Table` with data.

```javascript
const table = perspective.table({
    a: "integer",
    b: "float"
});
table.update(new_data);
```

#### Partial Updates

If `index` is not set, updates _append_ new data to the end of the `Table`.
However, if `index` is set, Perspective allows _partial updates_ (in-place)
using the `index` to determine which rows to update:

```javascript
// Create an indexed table
const table = perspective.table({
    "id": [1, 2, 3, 4],
    "name": ["a", "b", "c", "d"]
}, {index: "id"});

// Update rows with primary key `1` and `4`
table.update({
    "id": [1, 4],
    "name": ["x", "y"]
});
```

Provide a dataset with the rows to be updated as specified by primary key, and
Perspective handles the lookup into those rows and applies the specified
updates from the dataset. If `update` is called on an indexed `Table` and
no primary keys are specified, or if the specified keys are not present in the
`Table`, Perspective will append the dataset to the end of the `Table`.

### Remove

An indexed `Table` can also have rows removed by primary key:

```javascript
// Create an indexed table
const table = perspective.table({
    "id": [1, 2, 3, 4],
    "name": ["a", "b", "c", "d"]
}, {index: "id"});

// Remove rows with primary key `1` and `4`
table.remove([1, 4]);
```

To `remove` rows on an indexed `Table`, provide the `Table`'s `remove` method
with an array of primary key values indicating which rows should be removed.

### Delete

Because Perspective's runtime is composed of different languages (due to the
C++ engine), it is important to clean up resources that might have been created
in C++ and cannot be reached by garbage collectors in the binding language
(Javascript, Python etc.).

The `Table`'s `delete` method guarantees the cleanup of all resources associated
with a `Table`, which is _especially important_ in Javascript, as the JS garbage
collector [cannot automatically clean up](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#memory-management)
objects created in C++ through Emscripten.

It is best practice to explicitly `delete` any `Table`s when they are no longer
needed. Ensure that the `Table` has no `View`s created from it before deleting,
as an exception will be thrown.

### `on_delete`

The `on_delete` callback allows users to execute an action immediately after the
`Table` has been deleted. The callback runs after all resources have been
cleaned up and removed. Multiple `on_delete` callbacks can be set, and they will
run in the order in which they were set. If a callback is no longer needed, call
the `remove_delete` method on the `Table` and provide the reference to a
callback which should be removed and no longer called by Perspective.

## View

The `View` is Perspective's query and serialization interface. It represents a
query on the dataset represented by the `Table`, and is always created on an
existing `Table` instance:

```javascript
const table = perspective.table({
    "id": [1, 2, 3, 4],
    "name": ["a", "b", "c", "d"]
});

// Create a view showing just the `name` column
const view = table.view({
    columns: ["name"]
});
```

A `View` is guaranteed to contain the latest state
of the `Table`: a `View` created before its `Table` was updated with
new data will always contain the updated dataset, and all aggregates, pivots,
etc. will be recalculated to include the updated dataset.

The `Table` does not offer any query, transformation, or
serialization methods; all such operations are achieved by creating a `View`
with the desired query, and then serializing the data from the `View`. This
design decouples data loading with data querying, which means `View`s are
extremely cheap to create.

Like the `Table`, `View`s are immutable after creation, and a new `View` should
be created for each new query on the `Table`.

### Schema

The `View` has its own `schema`, which is a mapping of column names to data
types based on the `View`'s query.

This differs from the `Table` schema as the `View`'s column names are dependent
on whether the `View` has pivots applied, or whether it has selected certain
columns from the `Table` for inclusion.

The same holds for the `schema`'s data types, which can be altered depending on
the type of aggregate applied. A `count` aggregate applied over a string column,
for example, will return `"integer"` in the `View`'s `schema`.

### `on_update`

The `on_update` callback allows users to execute an action immediately after
the `View`'s underlying `Table` has been updated. This is useful in situations
where updating the `Table` leads to UI changes, recalculations, or any other
actions that need to be triggered. Multiple `on_update` callbacks can be
specified, and they will run in the order in which they were set. If a callback
is no longer needed to run, use the `remove_update` method on the `View`
instance.

### `on_delete`

The `on_delete` callback allows users to execute an action immediately after the
`View` has been deleted. Multiple `on_delete` callbacks can be specified, and
they will run in the order in which they were set. If a callback is no longer
needed, call the `remove_delete` method on the `View` instance.

### Delete

Similar to the `Table`, the `View`'s `delete` method guarantees cleanup of the
resources associated with the `View`. It is best practice to explicit delete
`View`s when they are no longer needed. All `View`s created from a `Table`
instance must be explicitly deleted before the `Table` can be deleted.

## Query Options

The `View`'s query options present a powerful and composable interface for data
query and transformation. All query options can be applied in conjunction with
each other, and there is no limit to the number of pivots, filters, etc. that
can be applied.

### Row Pivots

A row pivot _groups_ the dataset by the unique values of each column used as a
row pivot - a close analogue in SQL would be the `GROUP BY` statement.

The underlying dataset is aggregated to show the values belonging to
each group, and a total row is calculated for each column, showing the sum of
all aggregated values inside the column. Row pivots are useful for hierarchies,
categorizing data and attributing values, i.e. showing the number of units sold
based on State and City.

In Perspective, row pivots are represented as an array of string column names
which will be applied as row pivots:

```javascript
const view = table.view({row_pivots: ["a", "c"]});
```

Pivots are applied in the order provided
by the user, which allows for "drilling down" into data; for example, a row
pivot of `["State", "City", "Neighborhood"]` shows the values for each
neighborhood, which is grouped by city, which is in turn grouped by state. This
allows for extremely fine-grained analysis applied over a large dataset.

### Column Pivots

A column pivot _splits_ the dataset by the unique values of each column used as
a column pivot. The underlying dataset is not aggregated, and a new column is
created for each unique value of the column pivot. Each newly created column
contains the parts of the dataset that correspond to the column header, i.e.
a `View` that has `["State"]` as its column pivot will have a new column for
each state.

In Perspective, column pivots are represented as an array of string column names
which will be applied as column pivots:

```javascript
const view = table.view({column_pivots: ["a", "c"]});
```

Row pivots and column pivots can be used in conjunction to categorize and
traverse over datasets, showing the insights a user is interested in. Row and
column pivots are also easily transposable in `perspective-viewer`.

### Aggregates

Aggregates perform a calculation over an entire column, and are displayed when
one or more [Row Pivots](#row-pivots) are applied to the `View`. Aggregates can
be specified by the user, or Perspective will use the following sensible default
aggregates based on column type:

- "sum" for `integer` and `float` columns
- "count" for all other columns

Perspective provides a large selection of aggregate functions that can be
applied to columns in the `View` constructor using a dictionary of column
name to aggregate function name:

```javascript
const view = table.view({
    aggregates: {
        a: "avg",
        b: "distinct count"
    }
});
```

The `aggregates` dictionary only needs to contain columns for which the default
should be overridden.

### Columns

The `columns` property specifies which columns should be included in the
`View`'s output. This allows users to show or hide a specific subset of columns,
as well as control the order in which columns appear to the user.

This is represented in Perspective as an array of string column names passed to
the `View` constructor:

```javascript
const view = table.view({
    columns: ["a"]
});
```

### Sort

The `sort` property specifies columns on which the query should be sorted,
analogous to `ORDER BY` in SQL. A column can be sorted regardless of its
data type, and sorts can be applied in ascending or descending order.

Perspective represents `sort` as an array of arrays, with the values of each
inner array being a string column name and a string sort direction:

```javascript
const view = table.view({
    sort: [["a", "asc"]]
});
```

### Filter

The `filter` property specifies columns on which the query can be filtered,
returning rows that pass the specified filter condition. This is analogous
to the `WHERE` clause in SQL. There is no limit on the number of columns
where `filter` is applied, but the resulting dataset is one that passes
all the filter conditions, i.e. the filters are joined with an `AND` condition.

Perspective represents `filter` as an array of arrays, with the values of each
inner array being a string column name, a string filter operator, and a filter
operand in the type of the column:

```javascript
const view = table.view({
    filter: [["a", "<", 100]]
});
```
