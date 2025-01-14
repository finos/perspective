# Deleting a `table()` or `view()`

Unlike standard JavaScript objects, Perspective objects such as `table()` and
`view()` store their associated data in the WebAssembly heap. Because of this,
as well as the current lack of a hook into the JavaScript runtime's garbage
collector from WebAssembly, the memory allocated to these Perspective objects
does not automatically get cleaned up when the object falls out of scope.

In order to prevent memory leaks and reclaim the memory associated with a
Perspective `table()` or `view()`, you must call the `delete()` method:

```javascript
await view.delete();

// This method will throw an exception if there are still `view()`s depending
// on this `table()`!
await table.delete();
```

Similarly, `<perspective-viewer>` Custom Elements do not delete the memory
allocated for the UI when they are removed from the DOM.

```javascript
await viewer.delete();
```
