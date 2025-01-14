# `Table::clear` and `Table::replace`

Calling `Table::clear` will remove all data from the underlying `Table`. Calling
`Table::replace` with new data will clear the `Table`, and update it with a new
dataset that conforms to Perspective's data types and the existing schema on the
`Table`.

<div class="javascript">

```javascript
table.clear();
table.replace(json);
```

</div>
<div class="python">

```python
table.clear()
table.replace(df)
```
