# Tutorial: A tornado server in Python

Perspective ships with a pre-built Tornado handler that makes integration with
`tornado.websockets` extremely easy. This allows you to run an instance of
`Perspective` on a server using Python, open a websocket to a `Table`, and
access the `Table` in JavaScript and through `<perspective-viewer>`. All
instructions sent to the `Table` are processed in Python, which executes the
commands, and returns its output through the websocket back to Javascript.

### Python setup

Make sure Perspective and Tornado are installed!

```bash
pip install perspective-python tornado
```

To use the handler, we need to first have a `Server`, a `Client` and an instance
of a `Table`:

```python
import perspective

SERVER = perspective.Server()
CLIENT = SERVER.new_local_client()
```

Once the server has been created, create a `Table` instance with a name. The
name that you host the table under is important — it acts as a unique accessor
on the JavaScript side, which will look for a Table hosted at the websocket with
the name you specify.

```python
TABLE = client.table(data, name="data_source_one")
```

After the server and table setup is complete, create a websocket endpoint and
provide it a reference to `PerspectiveTornadoHandler`. You must provide the
configuration object in the route tuple, and it must contain
`"perspective_server"`, which is a reference to the `Server` you just created.

```python
from perspective.handlers.tornado import PerspectiveTornadoHandler

app = tornado.web.Application([

    # ... other handlers ...

    # Create a websocket endpoint that the client JavaScript can access
    (r"/websocket", PerspectiveTornadoHandler, {"perspective_server": SERVER, "check_origin": True})
])
```

Optionally, the configuration object can also include `check_origin`, a boolean
that determines whether the websocket accepts requests from origins other than
where the server is hosted. See
[Tornado docs](https://www.tornadoweb.org/en/stable/websocket.html#tornado.websocket.WebSocketHandler.check_origin)
for more details.

### JavaScript setup

Once the server is up and running, you can access the Table you just hosted
using `perspective.websocket` and `open_table()`. First, create a client that
expects a Perspective server to accept connections at the specified URL:

```javascript
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import perspective from "@finos/perspective";

const websocket = await perspective.websocket("ws://localhost:8888/websocket");
```

Next open the `Table` we created on the server by name:

```javascript
const table = await websocket.open_table("data_source_one");
```

`table` is a proxy for the `Table` we created on the server. All operations that
are possible through the JavaScript API are possible on the Python API as well,
thus calling `view()`, `schema()`, `update()` etc. on `const table` will pass
those operations to the Python `Table`, execute the commands, and return the
result back to JavaScript. Similarly, providing this `table` to a
`<perspective-viewer>` instance will allow virtual rendering:

```javascript
const viewer = document.createElement("perspective-viewer");
viewer.style.height = "500px";
document.body.appendChild(viewer);
await viewer.load(table);
```

`perspective.websocket` expects a Websocket URL where it will send instructions.
When `open_table` is called, the name to a hosted Table is passed through, and a
request is sent through the socket to fetch the Table. No actual `Table`
instance is passed inbetween the runtimes; all instructions are proxied through
websockets.

This provides for great flexibility — while `Perspective.js` is full of
features, browser WebAssembly runtimes currently have some performance
restrictions on memory and CPU feature utilization, and the architecture in
general suffers when the dataset itself is too large to download to the client
in full.

The Python runtime does not suffer from memory limitations, utilizes Apache
Arrow internal threadpools for threading and parallel processing, and generates
architecture optimized code, which currently makes it more suitable as a
server-side runtime than `node.js`.
