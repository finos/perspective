Retrieves the names of all tables that this client has access to.

`name` is a string identifier unique to the [`Table`] (per [`Client`]), which
can be used in conjunction with [`Client::open_table`] to get a [`Table`]
instance without the use of [`Client::table`] constructor directly (e.g., one
created by another [`Client`]).

<div class="javascript">

# JavaScript Examples

```javascript
const tables = await client.get_hosted_table_names();
```

</div>
<div class="python">

# Python Examples

```python
tables = client.get_hosted_table_names();
```

</div>
<div class="python">

# Examples

```rust
let tables = client.get_hosted_table_names().await;
```

</div>
