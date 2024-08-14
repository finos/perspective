Returns the name of the index column for the table.

<div class="javascript">

# JavaScript Examples

```javascript
const table = await client.table("x,y\n1,2\n3,4", { index: "x" });
const index = table.get_index(); // "x"
```

</div>
<div class="python">

# Python Examples

```python
table = client.table("x,y\n1,2\n3,4", index="x");
index = table.get_index() # "x"
```

</div>
<div class="rust">

# Examples

```rust
let options = TableInitOptions {index: Some("x".to_string()), ..default() };
let table = client.table("x,y\n1,2\n3,4", options).await;
let tables = client.open_table("table_one").await;
```

</div>
