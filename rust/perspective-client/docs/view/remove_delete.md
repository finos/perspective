Unregister a previously registered delete callback with this [`View`].

# Example

```javascript
// remove an `on_delete` callback
const callback = () => console.log("Deleted!");
view.remove_delete(callback);
```
