Delete this [`Table`] and cleans up associated resources.

[`Table`]s do not stop consuming resources or processing updates when they are
garbage collected in their host language - you must call this method to reclaim
these.

# Arguments

-   `options` An options dictionary.
    -   `lazy` Whether to delete this [`Table`] _lazily_. When false (the
        default), the delete will occur immediately, assuming it has no [`View`]
        instances registered to it (which must be deleted first, otherwise this
        method will throw an error). When true, the [`Table`] will only be
        marked for deltion once its [`View`] dependency count reaches 0.

<div class="javascript">

# JavaScript Examples

```javascript
const table = await client.table("x,y\n1,2\n3,4");

// ...

await table.delete({ lazy: true });
```

</div>
<div class="python">

# Python Examples

```python
table = client.table("x,y\n1,2\n3,4")

// ...

table.delete(lazy=True)
```

</div>
<div class="rust">

# Examples

```rust
let opts = TableInitOptions::default();
let data = TableData::Update(UpdateData::Csv("x,y\n1,2\n3,4".into()));
let table = client.table(data, opts).await?;

// ...

table.delete(DeleteOptions::default()).await?;
```

</div>
