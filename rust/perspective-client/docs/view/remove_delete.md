Unregister a previously registered delete callback with this view.

# Example

```js
// remove an `on_delete` callback
const callback = () => console.log("Deleted!");
view.remove_delete(callback);
```
