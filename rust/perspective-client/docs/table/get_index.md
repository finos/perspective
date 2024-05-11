Returns the name of the index column for the table.

# Examples

JavaScript:

```js
const table = await client.table("x,y\n1,2\n3,4", { index: "x" });
const index = table.get_index(); // "x"
```

Python:

```python
table = await async_client.table("x,y\n1,2\n3,4", index="x");
index = table.get_index() # "x"
```

Rust:

```rust
let options = TableInitOptions {index: Some("x".to_string()), ..default() };
let table = client.table("x,y\n1,2\n3,4", options).await;
let tables = client.open_table("table_one").await;
```
