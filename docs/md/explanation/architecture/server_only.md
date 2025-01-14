# Server-only

<img src="./architecture.sub3.svg" />

_For extremely large datasets with a small number of concurrent users._

The dataset is instantiated in-memory with a Python or Node.js server, and web
applications connect virtually. Has very good initial load performance, since no
data is downloaded. Group-by and other operations will run column-parallel if
configured.

But interactive performance is poor, as every user interaction must page the
server to render. Operations like scrolling are not as responsive and can be
impacted by network latency. Web applications must be "always connected" to the
server via WebSocket. Disconnecting will prevent any interaction, scrolling,
etc. of the UI. Does not use WebAssembly.

Each connected browser will impact server performance as long as the connection
is open, which in turn impacts interactive performance of every client. This
ultimately limits the horizontal scalabity of this architecture. Since each
client reads the perspective `Table` virtually, changes like edits and updates
are automatically reflected to all clients and persist across browser refresh.
Using the same Python server as the previous design, we can simply skip the
intermediate WebAssembly `Table` and pass the virtual table directly to `load()`

```javascript
const websocket = await perspective.websocket("ws://localhost:8080");
const server_table = await websocket.open_table("my_table");

const viewer = document.createElement("perspective-viewer");
document.body.appendChild(viewer);
await viewer.load(server_table);
```
