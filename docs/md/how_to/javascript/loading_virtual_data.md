### Loading data from a virtual `Table`

Loading a virtual (server-only) [`Table`] works just like loading a local/Web
Worker [`Table`] - just pass the virtual [`Table`] to `viewer.load()`. In the
browser:

```javascript
const elem = document.getElementsByTagName("perspective-viewer")[0];

// Bind to the server's worker instead of instantiating a Web Worker.
const websocket = await perspective.websocket(
    window.location.origin.replace("http", "ws")
);

// Bind the viewer to the preloaded data source.  `table` and `view` objects
// live on the server.
const server_table = await websocket.open_table("table_one");
await elem.load(server_table);
```

Alternatively, data can be _cloned_ from a server-side virtual `Table` into a
client-side WebAssemblt `Table`. The browser clone will be synced via delta
updates transferred via Apache Arrow IPC format, but local `View`s created will
be calculated locally on the client browser.

```javascript
const worker = await perspective.worker();
const server_view = await server_table.view();
const client_table = worker.table(server_view);
await elem.load(client_table);
```

`<perspective-viewer>` instances bound in this way are otherwise no different
than `<perspective-viewer>`s which rely on a Web Worker, and can even share a
host application with Web Worker-bound `table()`s. The same `promise`-based API
is used to communicate with the server-instantiated `view()`, only in this case
it is over a websocket.
