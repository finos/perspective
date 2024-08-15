Replace all rows in this [`Table`] with the input data, coerced to this
[`Table`]'s existing [`Schema`], notifying any derived [`View`] and
[`View::on_update`] callbacks.

Calling [`Table::replace`] is an easy way to replace _all_ the data in a
[`Table`] without losing any derived [`View`] instances or [`View::on_update`]
callbacks. [`Table::replace`] does _not_ infer data types like [`Client::table`]
does, rather it _coerces_ input data to the `Schema` like [`Table::update`]. If
you need a [`Table`] with a different `Schema`, you must create a new one.

<div class="javascript">

# JavaScript Examples

```javascript
await table.replace("x,y\n1,2");
```

</div>
<div class="python">

# Python Examples

```python
table.replace("x,y\n1,2")
```

</div>
<div class="rust">

# Examples

```rust
let data = UpdateData::Csv("x,y\n1,2".into());
let opts = UpdateOptions::default();
table.replace(data, opts).await?;
```

</div>
