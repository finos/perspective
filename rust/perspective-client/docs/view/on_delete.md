Register a callback with this view. Whenever the view is deleted, this callback will be invoked.

# Example

```js
// attach an `on_delete` callback
view.on_delete(() => console.log("Deleted!"));
```
