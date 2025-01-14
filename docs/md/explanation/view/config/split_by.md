# Split By

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
