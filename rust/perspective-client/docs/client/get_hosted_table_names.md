Retrieves the names of all tables that this client has access to.
This can be used in conjunction with [`Client::open_table`].

# Arguments

None.

# Examples

```js
const tables = await client.get_hosted_table_names();
```

```python
tables = await async_client.get_hosted_table_names();
```

```rust
let tables = client.get_hosted_table_names().await;
```
