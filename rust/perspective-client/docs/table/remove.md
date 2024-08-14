Removes rows from this [`Table`] with the `index` column values supplied.

# Arguments

-   `indices` - A list of `index` column values for rows that should be removed.

<div class="javascript">

# JavaScript Examples

```javascript
await table.remove([1, 2, 3]);
```

</div>
<div class="python">

# Python Examples

```python
tbl = Table({"a": [1, 2, 3]}, index="a")
tbl.remove([2, 3])
```

</div>
<div class="rust">

# Examples

```rust
table.remove(UpdateData::Csv("index\n1\n2\n3")).await?;
```

</div>
