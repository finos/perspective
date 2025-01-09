# Loading data from a Table

Data can be loaded into `<perspective-viewer>` in the form of a `Table()` or a
`Promise<Table>` via the `load()` method.

```javascript
// Create a new worker, then a new table promise on that worker.
const worker = await perspective.worker();
const table = await worker.table(data);

// Bind a viewer element to this table.
await viewer.load(table);
```

## Sharing a `Table` between multiple `<perspective-viewer>`s

Multiple `<perspective-viewer>`s can share a `table()` by passing the `table()`
into the `load()` method of each viewer. Each `perspective-viewer` will update
when the underlying `table()` is updated, but `table.delete()` will fail until
all `perspective-viewer` instances referencing it are also deleted:

```javascript
const viewer1 = document.getElementById("viewer1");
const viewer2 = document.getElementById("viewer2");

// Create a new WebWorker
const worker = await perspective.worker();

// Create a table in this worker
const table = await worker.table(data);

// Load the same table in 2 different <perspective-viewer> elements
await viewer1.load(table);
await viewer2.load(table);

// Both `viewer1` and `viewer2` will reflect this update
await table.update([{ x: 5, y: "e", z: true }]);
```
