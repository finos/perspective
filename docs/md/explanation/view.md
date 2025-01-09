# View

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
