The [`View`] struct is Perspective's query and serialization interface. It
represents a query on the `Table`'s dataset and is always created from an
existing `Table` instance via the [`Table::view`] method.

[`View`]s are immutable with respect to the arguments provided to the
[`Table::view`] method; to change these parameters, you must create a new
[`View`] on the same [`Table`]. However, each [`View`] is _live_ with respect to
the [`Table`]'s data, and will (within a conflation window) update with the
latest state as its parent [`Table`] updates, including incrementally
recalculating all aggregates, pivots, filters, etc. [`View`] query parameters
are composable, in that each parameter works independently _and_ in conjunction
with each other, and there is no limit to the number of pivots, filters, etc.
which can be applied.

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

# Examples

<div class="javascript">

```javascript
const table = await perspective.table({
    id: [1, 2, 3, 4],
    name: ["a", "b", "c", "d"],
});

const view = await table.view({ columns: ["name"] });
const json = await view.to_json();
await view.delete();
```

</div>
<div class="python">

```python
table = perspective.Table({
  "id": [1, 2, 3, 4],
  "name": ["a", "b", "c", "d"]
});

view = table.view(columns=["name"])
arrow = view.to_arrow()
view.delete()
```

</div>
<div class="rust">

```rust
let opts = TableInitOptions::default();
let data = TableData::Update(UpdateData::Csv("x,y\n1,2\n3,4".into()));
let table = client.table(data, opts).await?;

let view = table.view(None).await?;
let arrow = view.to_arrow().await?;
view.delete().await?;
```

</div>

## Querying data with [`Table::view`]

To query the table, create a [`Table::view`] on the table instance with an
optional configuration object. A [`Table`] can have as many [`View`]s associated
with it as you need - Perspective conserves memory by relying on a single
[`Table`] to power multiple [`View`]s concurrently:

<div class="javascript">

```javascript
const view = await table.view({
    columns: ["Sales"],
    aggregates: { Sales: "sum" },
    group_by: ["Region", "Country"],
    filter: [["Category", "in", ["Furniture", "Technology"]]],
});
```

</div>
<div class="python">

```python
view = table.view(
  columns=["Sales"],
  aggregates={"Sales": "sum"},
  group_by=["Region", "Country"],
  filter=[["Category", "in", ["Furniture", "Technology"]]]
)
```

</div>
<div class="rust">

```rust
use crate::config::*;
let view = table
    .view(Some(ViewConfigUpdate {
        columns: Some(vec![Some("Sales".into())]),
        aggregates: Some(HashMap::from_iter(vec![("Sales".into(), "sum".into())])),
        group_by: Some(vec!["Region".into(), "Country".into()]),
        filter: Some(vec![Filter::new("Category", "in", &[
            "Furniture",
            "Technology",
        ])]),
        ..ViewConfigUpdate::default()
    }))
    .await?;
```

</div>

### Group By

A group by _groups_ the dataset by the unique values of each column used as a
group by - a close analogue in SQL to the `GROUP BY` statement. The underlying
dataset is aggregated to show the values belonging to each group, and a total
row is calculated for each group, showing the currently selected aggregated
value (e.g. `sum`) of the column. Group by are useful for hierarchies,
categorizing data and attributing values, i.e. showing the number of units sold
based on State and City. In Perspective, group by are represented as an array of
string column names to pivot, are applied in the order provided; For example, a
group by of `["State", "City", "Postal Code"]` shows the values for each Postal
Code, which are grouped by City, which are in turn grouped by State.

<div class="javascript">

```javascript
const view = await table.view({ group_by: ["a", "c"] });
```

</div>
<div class="python">

```python
view = table.view(group_by=["a", "c"])
```

</div>
<div class="rust">

```rust
let view = table.view(Some(ViewConfigUpdate {
    group_by: Some(vec!["a".into(), "c".into()]),
    ..ViewConfigUpdate::default()
})).await?;
```

</div>

### Split By

A split by _splits_ the dataset by the unique values of each column used as a
split by. The underlying dataset is not aggregated, and a new column is created
for each unique value of the split by. Each newly created column contains the
parts of the dataset that correspond to the column header, i.e. a `View` that
has `["State"]` as its split by will have a new column for each state. In
Perspective, Split By are represented as an array of string column names to
pivot:

<div class="javascript">

```javascript
const view = await table.view({ split_by: ["a", "c"] });
```

</div>
<div class="python">

```python
view = table.view(split_by=["a", "c"])
```

</div>
<div class="rust">

```rust
let view = table.view(Some(ViewConfigUpdate {
    split_by: Some(vec!["a".into(), "c".into()]),
    ..ViewConfigUpdate::default()
})).await?;
```

</div>

### Aggregates

Aggregates perform a calculation over an entire column, and are displayed when
one or more [Group By](#group-by) are applied to the `View`. Aggregates can be
specified by the user, or Perspective will use the following sensible default
aggregates based on column type:

-   "sum" for `integer` and `float` columns
-   "count" for all other columns

Perspective provides a selection of aggregate functions that can be applied to
columns in the `View` constructor using a dictionary of column name to aggregate
function name.

<div class="javascript">

```javascript
const view = await table.view({
    aggregates: {
        a: "avg",
        b: "distinct count",
    },
});
```

</div>
<div class="python">

```python
view = table.view(
  aggregates={
    "a": "avg",
    "b": "distinct count"
  }
)
```

</div>
<div class="rust">

</div>

### Columns

The `columns` property specifies which columns should be included in the
`View`'s output. This allows users to show or hide a specific subset of columns,
as well as control the order in which columns appear to the user. This is
represented in Perspective as an array of string column names:

<div class="javascript">

```javascript
const view = await table.view({
    columns: ["a"],
});
```

</div>
<div class="python">

```python
view = table.view(columns=["a"])
```

</div>
<div class="rust">

</div>

### Sort

The `sort` property specifies columns on which the query should be sorted,
analogous to `ORDER BY` in SQL. A column can be sorted regardless of its data
type, and sorts can be applied in ascending or descending order. Perspective
represents `sort` as an array of arrays, with the values of each inner array
being a string column name and a string sort direction. When `column-pivots` are
applied, the additional sort directions `"col asc"` and `"col desc"` will
determine the order of pivot columns groups.

<div class="javascript">

```javascript
const view = await table.view({
    sort: [["a", "asc"]],
});
```

</div>
<div class="python">

```python
view = table.view(sort=[["a", "asc"]])
```

</div>

### Filter

The `filter` property specifies columns on which the query can be filtered,
returning rows that pass the specified filter condition. This is analogous to
the `WHERE` clause in SQL. There is no limit on the number of columns where
`filter` is applied, but the resulting dataset is one that passes all the filter
conditions, i.e. the filters are joined with an `AND` condition.

Perspective represents `filter` as an array of arrays, with the values of each
inner array being a string column name, a string filter operator, and a filter
operand in the type of the column:

<div class="javascript">

```javascript
const view = await table.view({
    filter: [["a", "<", 100]],
});
```

</div>
<div class="python">

```python
view = table.view(filter=[["a", "<", 100]])
```

</div>
<div class="rust">

</div>

### Expressions

The `expressions` property specifies _new_ columns in Perspective that are
created using existing column values or arbitary scalar values defined within
the expression. In `<perspective-viewer>`, expressions are added using the "New
Column" button in the side panel.

A custom name can be added to an expression by making the first line a comment:

<div class="javascript">

```javascript
const view = await table.view({
    expressions: { '"a" + "b"': '"a" + "b"' },
});
```

</div>
<div class="python">

```python
view = table.view(expressions=['"a" + "b"'])
```

</div>
<div class="rust">

</div>

## Flattening a [`Table::view`] into a [`Table`]

In Javascript, a [`Table`] can be constructed on a [`Table::view`] instance,
which will return a new [`Table`] based on the [`Table::view`]'s dataset, and
all future updates that affect the [`Table::view`] will be forwarded to the new
[`Table`]. This is particularly useful for implementing a
[Client/Server Replicated](server.md#clientserver-replicated) design, by
serializing the `View` to an arrow and setting up an `on_update` callback.

<div class="javascript">

```javascript
const worker1 = perspective.worker();
const table = await worker.table(data);
const view = await table.view({ filter: [["State", "==", "Texas"]] });
const table2 = await worker.table(view);
table.update([{ State: "Texas", City: "Austin" }]);
```

</div>
<div class="python">

```python
table = perspective.Table(data);
view = table.view(filter=[["State", "==", "Texas"]])
table2 = perspective.Table(view.to_arrow());

def updater(port, delta):
    table2.update(delta)

view.on_update(updater, mode="Row")
table.update([{"State": "Texas", "City": "Austin"}])
```

</div>
<div class="rust">

```rust
let opts = TableInitOptions::default();
let data = TableData::Update(UpdateData::Csv("x,y\n1,2\n3,4".into()));
let table = client.table(data, opts).await?;
let view = table.view(None).await?;
let table2 = client.table(TableData::View(view)).await?;
table.update(data).await?;
```

</div>
