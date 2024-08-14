Opens a [`Table`] that is hosted on the `perspective_server::Server` that is
connected to this [`Client`].

The `name` property of [`TableInitOptions`] is used to identify each [`Table`].
[`Table`] `name`s can be looked up for each [`Client`] via
[`Client::get_hosted_table_names`].

<div class="javascript">

# JavaScript Examples

Get a virtual [`Table`] named "table_one" from this [`Client`]

```javascript
const tables = await client.open_table("table_one");
```

</div>
<div class="python">

# Python Examples

```python
tables = client.open_table("table_one");
```

</div>
<div class="rust">

# Examples

```rust
let tables = client.open_table("table_one").await;
```

</div>
