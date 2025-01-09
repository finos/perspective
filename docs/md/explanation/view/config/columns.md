# Columns

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
