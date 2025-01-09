# Group By

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
