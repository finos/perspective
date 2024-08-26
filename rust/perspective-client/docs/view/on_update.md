Register a callback with this [`View`]. Whenever the view's underlying table
emits an update, this callback will be invoked with an object containing
`port_id`, indicating which port the update fired on, and optionally `delta`,
which is the new data that was updated for each cell or each row.

# Arguments

-   `on_update` - A callback function invoked on update, which receives an
    object with two keys: `port_id`, indicating which port the update was
    triggered on, and `delta`, whose value is dependent on the mode parameter.
-   `options` - If this is provided as
    `OnUpdateOptions { mode: Some(OnUpdateMode::Row) }`, then `delta` is an
    Arrow of the updated rows. Otherwise `delta` will be [`Option::None`].

<div class="javascript">

# JavaScript Examples

```javascript
// Attach an `on_update` callback
view.on_update((updated) => console.log(updated.port_id));
```

```javascript
// `on_update` with row deltas
view.on_update((updated) => console.log(updated.delta), { mode: "row" });
```

</div>
