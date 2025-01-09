# Sort

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
