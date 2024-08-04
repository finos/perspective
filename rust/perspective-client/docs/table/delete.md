Delete this [`Table`] and cleans up associated resources, assuming it has no
[`View`] instances registered to it (which must be deleted first).

[`Table`]s do not stop consuming resources or processing updates when they are
garbage collected in their host language - you must call this method to reclaim
these.

<div class="javascript">

# JavaScript Examples

```javascript
const table = await client.table("x,y\n1,2\n3,4");

// ...

await table.delete();
```

</div>
<div class="python">

# Python Examples

```python
table = client.table("x,y\n1,2\n3,4")

// ...

table.delete()
```

</div>
<div class="rust">

# Examples

```rust
let opts = TableInitOptions::default();
let data = TableData::Update(UpdateData::Csv("x,y\n1,2\n3,4".into()));
let table = client.table(data, opts).await?;

// ...

table.delete().await?;
```

</div>
