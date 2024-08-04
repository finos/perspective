Unregister a previously registered update callback with this [`View`].

# Example

```javascript
// remove an `on_update` callback
const callback = () => console.log("Updated!");
view.remove_update(callback);
```
