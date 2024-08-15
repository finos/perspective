Unregister a previously registered update callback with this [`View`].

# Arguments

-   `id` - A callback `id` as returned by a recipricol call to
    [`View::on_update`].

<div class="javascript">

# JavaScript Examples

```javascript
const callback = () => console.log("Updated!");
const id = await view.on_update(callback);
await view.remove_update(id);
```

</div>
<div class="python">

# Python Examples

```python
callback = lambda x: print(x)
cid = await view.on_update(callback)
await view.remove_update(cid)
```

</div>
<div class="rust">

# Examples

```rust
let callback = |_| async { print!("Updated!") };
let cid = view.on_update(callback, OnUpdateOptions::default()).await?;
view.remove_update(cid).await?;
```

</div>
