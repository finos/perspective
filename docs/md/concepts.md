---
id: concepts
title: Conceptual Overview
---

Perspective is designed and built as an _interactive_ visualization
component for _large, real-time_ datasets. It is designed to be fast, intuitive,
and easily composable, making fine-grained analysis possible on any dataset.

## Overview

This document outlines the main concepts behind Perspective:

- [`Table`](#table) Perspective's typed data interface
- [`View`](#view) a query from a `Table` that calculates and returns data

and explains (with live examples) the query options that can be used to create
a `View`:

- [`row_pivots`](#row-pivots) splitting the dataset by unique row values
- [`column_pivots`](#column-pivots) splitting the dataset by unique column
  values
- [`aggregates`](#aggregates) calculations over the dataset such as `sum`,
  `average`, or `distinct count`
- [`columns`](#columns) specifying the columns the user is interested in seeing
- [`sort`](#sort) ordering the dataset based on a column's values
- [`filter`](#filter) filtering the dataset based on a column's values

For language-specific guidance, API documentation, or quick-start user guides,
use the sidebar to find the documentation for the language of choice. Though
the way these concepts operate in practice may vary slightly across different
languages based on nuance, the concepts documented here hold true across all
implementations of the Perspective library.

<!--truncate-->

<script src="../../../../js/concepts/index.js"></script>
<link rel="stylesheet" href="../../../../css/concepts/index.css">

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
an arbitrary set of columns from the `Table`.

The immutability of columns and data types after creation is important, as it
allows Perspective to operate quickly over a large dataset and accumulate data
without additional recalculation.

### Schema and Supported Data Types

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
};
```

Because Perspective is built in multiple languages, data types are
expressed with a common vocabulary of across all supported host languages.
These _String_ types are used to represent the data supported by Perspective:

- `"integer"`: a 32-bit (or 64-bit depending on platform) integer
- `"float"`: a 64-bit float
- `"boolean"`: a boolean value of true or false
- `"date"`: a date containing year, month, and day
- `"datetime"`: a datetime containing year, month, day, hour, minute, second,
  and microsecond
- `"string"`: a unicode string without any character limits

In supported languages e.g. Python, you may alternatively use native types:

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

A `Table` can be initialized in two ways:

- With a [`schema`](#schema-and-data-types);  this table will be initialized
  empty.
- With a dataset in a supported format;  in this case, a `schema` is inferred
  from the dataset's structure upon initialization.  Perspective supports a
  variety of table-like data structures in Python and Javascript such as CSV,
  `pandas.DataFrame` and JSON; see the language specific API documentation for
  a comprehensive list of supported formats.

### Limit

Initializing a `Table` with a `limit` sets the total number of rows the `Table`
is allowed to have.  When the `Table` is updated, and the resulting size of
the `Table` would exceed its `limit`, rows that exceed `limit` overwrite the
oldest rows in the `Table`.

To create a `Table` with a `limit`, provide the `limit` property with an integer
indicating the `limit`:

```javascript
const table = await perspective.table(data, {limit: 1000});
```

`limit` cannot be used in conjunction with `index`.

### Index

Initializing a `Table` with an `index` allows Perspective to treat a column as
the primary key, allowing in-place updates of rows. Only a
single column can be used as an `index`, and like other `Table` parameters,
cannot be changed or removed after the `Table` creation. A column of any type
may be used as an `index`.

To create an indexed `Table`, provide the `index` property with a string column
name to be used as an index:

```javascript
const table = await perspective.table(data, {index: "a"});
```

An indexed `Table` allows for in-place _updates_ whenever a new rows shares an
`index` values with an existing row, _partial updates_ when such a row leaves
some column values `undefined`, and _removes_ to delete a row by `index`.

### `update()`

Once a `Table` has been created, it can be updated with new data conforming to
the `Table`'s `schema`. The dataset used for `update()` must conform with the
formats supported by Perspective, and cannot be a `schema` (as the `schema`
is immutable).

If a `Table` was initialized with a `schema` instead of a dataset, use `update`
to fill the `Table` with data.

```javascript
const table = await perspective.table({
    a: "integer",
    b: "float"
});
table.update(new_data);
```

If `index` is not set, updates _append_ new data to the end of the `Table`.
However, if `index` is set, Perspective allows _partial updates_ (in-place)
using the `index` to determine which rows to update:

```javascript
// Create an indexed table
const table = await perspective.table(
    {
        id: [1, 2, 3, 4],
        name: ["a", "b", "c", "d"]
    },
    {index: "id"}
);

// Update rows with primary key `1` and `4`
table.update({
    id: [1, 4],
    name: ["x", "y"]
});
```

Provide a dataset with the rows to be updated as specified by primary key, and
Perspective handles the lookup into those rows and applies the specified
updates from the dataset. If `update` is called on an indexed `Table` and
no primary keys are specified, or if the specified keys are not present in the
`Table`, Perspective will append the dataset to the end of the `Table`.

### `remove()`

An indexed `Table` can also have rows removed by primary key:

```javascript
// Create an indexed table
const table = await perspective.table(
    {
        id: [1, 2, 3, 4],
        name: ["a", "b", "c", "d"]
    },
    {index: "id"}
);

// Remove rows with primary key `1` and `4`
table.remove([1, 4]);
```

To `remove` rows on an indexed `Table`, provide the `Table`'s `remove` method
with an array of primary key values indicating which rows should be removed.

### `delete()`

Due to Perspective's runtime composition, it is important to clean up resources
that might have been created by the engine in C++ but cannot be reached by the
binding language's garbage collector (Javascript, Python etc.)

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

## `View`

The View is Perspective's query and serialization interface. It represents a
query on the `Table`'s dataset and is always created from an existing `Table`
instance via the `view()` method with a set of
[`View` configuration parameters](https://perspective.finos.org/docs/obj/perspective.html#module_perspective..table+view):

```javascript
const table = await perspective.table({
    id: [1, 2, 3, 4],
    name: ["a", "b", "c", "d"]
});

// Create a view showing just the `name` column.
const view = await table.view({
    columns: ["name"]
});

// Now you have a `View`!  Get your data using ES6 async/await:
const json = async () => await view.to_json();

// or using the Promise API
view.to_arrow().then(arrow => console.log(arrow));

// Delete the Query!
view.delete();
```

`View` objects are immutable with respect to the arguments provided to the
`view()` method;  to change these parameters, you must create a new `View` on
the same `Table`. However, `View`s are live with respect to the `Table`'s data,
and will (within a conflation window) update with the latest state as its
parent's state updates, including incrementally recalculating all aggregates,
pivots, filters, etc.

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

### `delete()`

Similar to the `Table`, the `View`'s `delete` method guarantees cleanup of the
resources associated with the `View`. It is best practice to explicit delete
`View`s when they are no longer needed. All `View`s created from a `Table`
instance must be explicitly deleted before the `Table` can be deleted.

## `View` Query Parameters

The `View`'s query parameters present a powerful and composable interface for
data query and transformation. All parameters can be applied in conjunction
with each other, and there is no limit to the number of pivots, filters, etc.
that can be applied.

*All* examples in this section are live—feel free to play around with each
`<perspective-viewer>` instance to see how different query parameters affect
what you see.

### Row Pivots

A row pivot _groups_ the dataset by the unique values of each column used as a
row pivot - a close analogue in SQL would be the `GROUP BY` statement.

The underlying dataset is aggregated to show the values belonging to
each group, and a total row is calculated for each group, showing the currently
selected aggregated value (e.g. `sum`) of the column. Row pivots are useful for
hierarchies, categorizing data and attributing values, i.e. showing the number
of units sold based on State and City.

In Perspective, row pivots are represented as an array of string column names
which will be applied as row pivots:

```javascript
const view = await table.view({row_pivots: ["a", "c"]});
```

Pivots are applied in the order provided
by the user, which allows for "drilling down" into data; for example, a row
pivot of `["State", "City", "Neighborhood"]` shows the values for each
neighborhood, which is grouped by city, which is in turn grouped by state. This
allows for extremely fine-grained analysis applied over a large dataset.

#### Example

```html
<perspective-viewer row-pivots='["State", "City"]' columns='["Sales", "Profit"]'>
```

<div>
<perspective-viewer row-pivots='["State", "City"]' columns='["Sales", "Profit"]'>
</perspective-viewer>
</div>

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
const view = await table.view({column_pivots: ["a", "c"]});
```

Row pivots and column pivots can be used in conjunction to categorize and
traverse over datasets, showing the insights a user is interested in. Row and
column pivots are also easily transposable in `perspective-viewer`.

#### Example

```html
<perspective-viewer
    row-pivots='["Category"]'
    column-pivots='["Region"]'
    columns='["Sales", "Profit"]'>
```

<div>
<perspective-viewer row-pivots='["Category"]' column-pivots='["Region"]' columns='["Sales", "Profit"]'>
</perspective-viewer>
</div>

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
const view = await table.view({
    aggregates: {
        a: "avg",
        b: "distinct count"
    }
});
```

#### Example

```html
<perspective-viewer
    aggregates='{"Sales": "avg", "Profit", "median"}'
    row-pivots='["State", "City"]'
    columns='["Sales", "Profit"]'>
```

<div>
<perspective-viewer aggregates='{"Sales": "avg", "Profit": "median"}' row-pivots='["State", "City"]' columns='["Sales", "Profit"]'>
</perspective-viewer>
</div>

### Columns

The `columns` property specifies which columns should be included in the
`View`'s output. This allows users to show or hide a specific subset of columns,
as well as control the order in which columns appear to the user.

This is represented in Perspective as an array of string column names passed to
the `View` constructor:

```javascript
const view = await table.view({
    columns: ["a"]
});
```

#### Example

```html
<perspective-viewer columns='["Sales", "Profit", "Segment"]'>
```

<div>
<perspective-viewer columns='["Sales", "Profit", "Segment"]'>
</perspective-viewer>
</div>

### Sort

The `sort` property specifies columns on which the query should be sorted,
analogous to `ORDER BY` in SQL. A column can be sorted regardless of its
data type, and sorts can be applied in ascending or descending order.

Perspective represents `sort` as an array of arrays, with the values of each
inner array being a string column name and a string sort direction:

```javascript
const view = await table.view({
    sort: [["a", "asc"]]
});
```

#### Example

```html
<perspective-viewer columns='["Sales", "Profit"]' sort='[["Sales", "desc"]]'>
```

<div>
<perspective-viewer columns='["Sales", "Profit"]' sort='[["Sales", "desc"]]'>
</perspective-viewer>
</div>

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
const view = await table.view({
    filter: [["a", "<", 100]]
});
```

#### Example

Note: Use the `filters` attribute on `<perspective-viewer>` instead of
`filter`.

```html
<perspective-viewer columns='["Sales", "Profit"]' filters='[["State", "==", "Texas"]]'>
```

<div>
<perspective-viewer columns='["Sales", "Profit"]' filters='[["State","==","Texas"]]'>
</perspective-viewer>
</div>
