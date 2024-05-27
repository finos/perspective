The schema of this view.

A schema is an Object, the keys of which are the columns of this view, and the values are their string type names. If this view is aggregated, theses will be the aggregated types; otherwise these types will be the same as the columns in the underlying table.

# Examples

```js
// Create a view
const view = await table.view({
    columns: ["a", "b"],
});
const schema = await view.schema(); // {a: "float", b: "string"}
```
