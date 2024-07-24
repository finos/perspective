Opens a [`Table`] that is hosted on the [`perspective_server::Server`] that is
connected to this [`Client`]. The `name` property of [`TableInitOptions`]

# Examples

```js
const tables = await client.open_table("table_one");
```

```python
tables = client.open_table("table_one");
```

```rust
let tables = client.open_table("table_one").await;
```
