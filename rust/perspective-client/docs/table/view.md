Create a new [`View`] from this table with a specified [`ViewConfigUpdate`].

See [`View`] struct.

<div class="javascript">

# JavaScript Examples

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

# Python Examples

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

# Examples

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
