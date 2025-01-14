# `Table::update` and `Table::remove`

Once a `Table` has been created, it can be updated with new data conforming to
the `Table`'s schema. `Table::update` supports the same data formats as
`Client::table`, minus _schema_.

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

Any value on a `Client::table` can be unset using the value `null` in JSON or
Arrow input formats. Values may be unset on construction, as any `null` in the
dataset will be treated as an unset value. `Table::update` calls do not need to
provide _all columns_ in the `Table`'s schema; missing columns will be omitted
from the `Table`'s updated rows.

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

Rows can also be removed from an indexed `Table`, by calling `Table::remove`
with an array of index values:

<div class="javascript">

```javascript
indexed_table.remove([1, 4]);
```

</div>
<div class="python">

```python
// Python

indexed_table.remove([1, 4])
```

</div>
