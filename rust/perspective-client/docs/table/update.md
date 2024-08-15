Updates the rows of this table and any derived [`View`] instances.

Calling [`Table::update`] will trigger the [`View::on_update`] callbacks
register to derived [`View`], and the call itself will not resolve until _all_
derived [`View`]'s are notified.

When updating a [`Table`] with an `index`, [`Table::update`] supports partial
updates, by omitting columns from the update data.

# Arguments

-   `input` - The input data for this [`Table`]. The schema of a [`Table`] is
    immutable after creation, so this method cannot be called with a schema.
-   `options` - Options for this update step - see [`UpdateOptions`].

<div class="javascript">

# JavaScript Examples

```javascript
await table.update("x,y\n1,2");
```

</div>
<div class="python">

# Python Examples

```python
table.update("x,y\n1,2")
```

</div>
<div class="rust">

# Examples

```rust
let data = UpdateData::Csv("x,y\n1,2".into());
let opts = UpdateOptions::default();
table.update(data, opts).await?;
```

</div>
