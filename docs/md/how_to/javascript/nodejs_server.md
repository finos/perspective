# Server-only via `WebSocketServer()` and Node.js

For exceptionally large datasets, a `Client` can be bound to a
`perspective.table()` instance running in Node.js/Python/Rust remotely, rather
than creating one in a Web Worker and downloading the entire data set. This
trades off network bandwidth and server resource requirements for a smaller
browser memory and CPU footprint.

An example in Node.js:

```javascript
const { WebSocketServer, table } = require("@finos/perspective");
const fs = require("fs");

// Start a WS/HTTP host on port 8080.  The `assets` property allows
// the `WebSocketServer()` to also serves the file structure rooted in this
// module's directory.
const host = new WebSocketServer({ assets: [__dirname], port: 8080 });

// Read an arrow file from the file system and host it as a named table.
const arr = fs.readFileSync(__dirname + "/superstore.lz4.arrow");
await table(arr, { name: "table_one" });
```

... and the [`Client`] implementation in the browser:

```javascript
const elem = document.getElementsByTagName("perspective-viewer")[0];

// Bind to the server's worker instead of instantiating a Web Worker.
const websocket = await perspective.websocket(
    window.location.origin.replace("http", "ws")
);

// Create a virtual `Table` to the preloaded data source.  `table` and `view`
// objects live on the server.
const server_table = await websocket.open_table("table_one");
```
