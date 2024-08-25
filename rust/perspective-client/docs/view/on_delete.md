Register a callback with this [`View`]. Whenever the [`View`] is deleted, this
callback will be invoked.

<div class="javascript">

# JavaScript Examples

```javascript
// attach an `on_delete` callback
view.on_delete(() => console.log("Deleted!"));
```

</div>
