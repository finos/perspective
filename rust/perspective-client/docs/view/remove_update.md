Unregister a previously registered update callback with this view.

# Example

```js
// remove an `on_update` callback
const callback = () => console.log("Updated!");
view.remove_update(callback);
```
