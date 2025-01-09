# Filter

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
