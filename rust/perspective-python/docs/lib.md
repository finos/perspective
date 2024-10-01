The Python language bindings for [Perspective](https://perspective.finos.org), a
high performance data-visualization and analytics component for the web browser.

<div class="warning">
The examples in this module are in Python. See <a href="https://docs.rs/crate/perspective/latest"><code>perspective</code></a> docs for the Rust API.
</div>

# Python Examples

A simple example which loads an [Apache Arrow](https://arrow.apache.org/) and
computes a "Group By" operation, returning a new Arrow.

```python
from perspective import Server

client = Server().new_local_client()
table = client.table(arrow_bytes_data)
view = table.view(group_by = ["CounterParty", "Security"])
arrow = view.to_arrow()
```

# What is `perspective-python`

Perspective for Python uses the exact same C++ data engine used by the
[WebAssembly version](https://docs.rs/perspective-js/latest/perspective_js/) and
[Rust version](https://docs.rs/crate/perspective/latest). The library consists
of many of the same abstractions and API as in JavaScript, as well as
Python-specific data loading support for [NumPy](https://numpy.org/),
[Pandas](https://pandas.pydata.org/) (and
[Apache Arrow](https://arrow.apache.org/), as in JavaScript).

Additionally, `perspective-python` provides a session manager suitable for
integration into server systems such as
[Tornado websockets](https://www.tornadoweb.org/en/stable/websocket.html),
[AIOHTTP](https://docs.aiohttp.org/en/stable/web_quickstart.html#websockets), or
[Starlette](https://www.starlette.io/websockets/)/[FastAPI](https://fastapi.tiangolo.com/advanced/websockets/),
which allows fully _virtual_ Perspective tables to be interacted with by
multiple `<perspective-viewer>` in a web browser. You can also interact with a
Perspective table from python clients, and to that end client libraries are
implemented for both Tornado and AIOHTTP.

As `<perspective-viewer>` will only consume the data necessary to render the
current screen, this runtime mode allows _ludicrously-sized_ datasets with
instant-load after they've been manifest on the server (at the expense of
network latency on UI interaction).

The included `PerspectiveWidget` allows running such a viewer in
[JupyterLab](https://jupyterlab.readthedocs.io/en/stable/) in either server or
client (via WebAssembly) mode, and the included `PerspectiveTornadoHandler`
makes it simple to extend a Tornado server with virtual Perspective support.

The `perspective` module exports several tools:

-   `Server` the constructor for a new isntance of the Perspective data engine.
-   The `perspective.widget` module exports `PerspectiveWidget`, the JupyterLab
    widget for interactive visualization in a notebook cell.
-   The `perspective.handlers` modules exports web frameworks handlers that
    interface with a `perspective-client` in JavaScript.
    -   `perspective.handlers.tornado.PerspectiveTornadoHandler` for
        [Tornado](https://www.tornadoweb.org/)
    -   `perspective.handlers.starlette.PerspectiveStarletteHandler` for
        [Starlette](https://www.starlette.io/) and
        [FastAPI](https://fastapi.tiangolo.com)
    -   `perspective.handlers.aiohttp.PerspectiveAIOHTTPHandler` for
        [AIOHTTP](https://docs.aiohttp.org),

This user's guide provides an overview of the most common ways to use
Perspective in Python: the `Table` API, the JupyterLab widget, and the Tornado
handler.

[More Examples](https://github.com/finos/perspective/tree/master/examples) are
available on GitHub.

## Installation

`perspective-python` contains full bindings to the Perspective API, a JupyterLab
widget, and a WebSocket handlers for several webserver libraries that allow you
to host Perspective using server-side Python.

### PyPI

`perspective-python` can be installed from [PyPI](https://pypi.org) via `pip`:

```bash
pip install perspective-python
```

<!--
### Anaconda

`perspective-python` can also be installed for [Anaconda](https://anaconda.org/)
via [Conda Forge](https://conda-forge.org)

```bash
conda install -c conda-forge perspective
``` -->

### Jupyterlab

`PerspectiveWidget` is a JupyterLab widget that implements the same API as
`<perspective-viewer>`, allowing for fast, intuitive
transformations/visualizations of various data formats within JupyterLab.

`PerspectiveWidget` is compatible with Jupyterlab 3 and Jupyter Notebook 6 via a
[prebuilt extension](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html#prebuilt-extensions).
To use it, simply install `perspective-python` and the extensions should be
available.

`perspective-python`'s JupyterLab extension also provides convenient builtin
viewers for `csv`, `json`, or `arrow` files. Simply right-click on a file with
this extension and choose the appropriate `Perpective` option from the context
menu.

## `Table`

A `Table` can be created from a dataset or a schema, the specifics of which are
[discussed](#loading-data-with-table) in the JavaScript section of the user's
guide. In Python, however, Perspective supports additional data types that are
commonly used when processing data:

-   `pandas.DataFrame`
-   `bytes` (encoding an Apache Arrow)
-   `objects` (either extracting a repr or via reference)
-   `str` (encoding as a CSV)

A `Table` is created in a similar fashion to its JavaScript equivalent:

```python
from datetime import date, datetime
import numpy as np
import pandas as pd
import perspective

data = pd.DataFrame({
    "int": np.arange(100),
    "float": [i * 1.5 for i in range(100)],
    "bool": [True for i in range(100)],
    "date": [date.today() for i in range(100)],
    "datetime": [datetime.now() for i in range(100)],
    "string": [str(i) for i in range(100)]
})

table = perspective.table(data, index="float")
```

Likewise, a `View` can be created via the `view()` method:

```python
view = table.view(group_by=["float"], filter=[["bool", "==", True]])
column_data = view.to_columns()
row_data = view.to_json()
```

### Pandas Support

Perspective's `Table` can be constructed from `pandas.DataFrame` objects.
Internally, this just uses
[`pyarrow::from_pandas`](https://arrow.apache.org/docs/python/pandas.html),
which dictates behavior of this feature including type support.

If the dataframe does not have an index set, an integer-typed column named
`"index"` is created. If you want to preserve the indexing behavior of the
dataframe passed into Perspective, simply create the `Table` with
`index="index"` as a keyword argument. This tells Perspective to once again
treat the index as a primary key:

```python
data.set_index("datetime")
table = perspective.table(data, index="index")
```

#### Time Zone Handling

When parsing `"datetime"` strings, times are assumed _local time_ unless an
explicit timezone offset is parsed. All `"datetime"` columns (regardless of
input time zone) are _output_ to the user as `datetime.datetime` objects in
_local time_ according to the Python runtime.

This behavior is consistent with Perspective's behavior in JavaScript. For more
details, see this in-depth
[explanation](https://github.com/finos/perspective/pull/867) of
`perspective-python` semantics around time zone handling.

### Callbacks and Events

`perspective.Table` allows for `on_update` and `on_delete` callbacks to be
set—simply call `on_update` or `on_delete` with a reference to a function or a
lambda without any parameters:

```python
def update_callback():
    print("Updated!")

# set the update callback
on_update_id = view.on_update(update_callback)


def delete_callback():
    print("Deleted!")

# set the delete callback
on_delete_id = view.on_delete(delete_callback)

# set a lambda as a callback
view.on_delete(lambda: print("Deleted x2!"))
```

If the callback is a named reference to a function, it can be removed with
`remove_update` or `remove_delete`:

```python
view.remove_update(on_update_id)
view.remove_delete(on_delete_id)
```

Callbacks defined with a lambda function cannot be removed, as lambda functions
have no identifier.

#### Multi-threading

Perspective's server API releases the GIL when called (though it may be retained
for some portion of the `Client` call to encode RPC messages). It also
dispatches to an internal thread pool for some operations, enabling better
parallelism and overall better server performance. However, Perspective's Python
interface itself will still process queries in a single queue. To enable
parallel query processing, call `set_loop_callback` with a multi-threaded
executor such as `concurrent.futures.ThreadPoolExecutor`:

```python
def perspective_thread():
    server = perspective.Server()
    loop = tornado.ioloop.IOLoop()
    with concurrent.futures.ThreadPoolExecutor() as executor:
        server.set_loop_callback(loop.run_in_executor, executor)
        loop.start()
```

### Hosting `Table` and `View` instances

`Server` "hosts" all `perspective.Table` and `perspective.View` instances
created by its connected `Client`s. Hosted tables/views can have their methods
called from other sources than the Python server, i.e. by a `perspective-viewer`
running in a JavaScript client over the network, interfacing with
`perspective-python` through the websocket API.

The server has full control of all hosted `Table` and `View` instances, and can
call any public API method on hosted instances. This makes it extremely easy to
stream data to a hosted `Table` using `.update()`:

```python
server = perspective.Server()
client = server.new_local_client()
table = client.table(data, name="data_source")

for i in range(10):
    # updates continue to propagate automatically
    table.update(new_data)
```

The `name` provided is important, as it enables Perspective in JavaScript to
look up a `Table` and get a handle to it over the network. Otherwise, `name`
will be assigned randomlu and the `Client` must look this up with
`CLient.get_hosted_table_names()`

### Client/Server Replicated Mode

Using Tornado and
[`PerspectiveTornadoHandler`](python.md#perspectivetornadohandler), as well as
`Perspective`'s JavaScript library, we can set up "distributed" Perspective
instances that allows multiple browser `perspective-viewer` clients to read from
a common `perspective-python` server, as in the
[Tornado Example Project](https://github.com/finos/perspective/tree/master/examples/python-tornado).

This architecture works by maintaining two `Tables`—one on the server, and one
on the client that mirrors the server's `Table` automatically using `on_update`.
All updates to the table on the server are automatically applied to each client,
which makes this architecture a natural fit for streaming dashboards and other
distributed use-cases. In conjunction with [multithreading](#multi-threading),
distributed Perspective offers consistently high performance over large numbers
of clients and large datasets.

_*server.py*_

```python
from perspective import Server
from perspective.hadnlers.tornado import PerspectiveTornadoHandler

# Create an instance of Server, and host a Table
SERVER = Server()
CLIENT = SERVER.new_local_client()

# The Table is exposed at `localhost:8888/websocket` with the name `data_source`
client.table(data, name = "data_source")

app = tornado.web.Application([
    # create a websocket endpoint that the client JavaScript can access
    (r"/websocket", PerspectiveTornadoHandler, {"perspective_server": SERVER})
])

# Start the Tornado server
app.listen(8888)
loop = tornado.ioloop.IOLoop.current()
loop.start()
```

Instead of calling `load(server_table)`, create a `View` using `server_table`
and pass that into `viewer.load()`. This will automatically register an
`on_update` callback that synchronizes state between the server and the client.

_*index.html*_

```html
<perspective-viewer id="viewer" editable></perspective-viewer>

<script>
    window.addEventListener("DOMContentLoaded", async function () {
        // Create a client that expects a Perspective server
        // to accept connections at the specified URL.
        const websocket = await perspective.websocket(
            "ws://localhost:8888/websocket"
        );

        // Get a handle to the Table on the server
        const server_table = await websocket.open_table("data_source_one");

        // Create a new view
        const server_view = await table.view();

        // Create a Table on the client using `perspective.worker()`
        const worker = await perspective.worker();
        const client_table = await worker.table(view);

        // Load the client table in the `<perspective-viewer>`.
        document.getElementById("viewer").load(client_table);
    });
</script>
```

For a more complex example that offers distributed editing of the server
dataset, see
[client_server_editing.html](https://github.com/finos/perspective/blob/master/examples/python-tornado/client_server_editing.html).

We also provide examples for Starlette/FastAPI and AIOHTTP:

-   [Starlette Example Project](https://github.com/finos/perspective/tree/master/examples/python-starlette).
-   [AIOHTTP Example Project](https://github.com/finos/perspective/tree/master/examples/python-aiohttp).

### Server-only Mode

The server setup is identical to [Distributed Mode](#distributed-mode) above,
but instead of creating a view, the client calls `load(server_table)`: In
Python, use `Server` and `PerspectiveTornadoHandler` to create a websocket
server that exposes a `Table`. In this example, `table` is a proxy for the
`Table` we created on the server. All API methods are available on _proxies_,
the.g.us calling `view()`, `schema()`, `update()` on `table` will pass those
operations to the Python `Table`, execute the commands, and return the result
back to Javascript.

```html
<perspective-viewer id="viewer" editable></perspective-viewer>
```

```javascript
const websocket = perspective.websocket("ws://localhost:8888/websocket");
const table = websocket.open_table("data_source");
document.getElementById("viewer").load(table);
```

## `PerspectiveWidget`

Building on top of the API provided by `perspective.Table`, the
`PerspectiveWidget` is a JupyterLab plugin that offers the entire functionality
of Perspective within the Jupyter environment. It supports the same API
semantics of `<perspective-viewer>`, along with the additional data types
supported by `perspective.Table`. `PerspectiveWidget` takes keyword arguments
for the managed `View`:

```python
from perspective import PerspectiveWidget
w = perspective.PerspectiveWidget(
    data,
    plugin="X Bar",
    aggregates={"datetime": "any"},
    sort=[["date", "desc"]]
)
```

### Creating a widget

A widget is created through the `PerspectiveWidget` constructor, which takes as
its first, required parameter a `perspective.Table`, a dataset, a schema, or
`None`, which serves as a special value that tells the Widget to defer loading
any data until later. In maintaining consistency with the Javascript API,
Widgets cannot be created with empty dictionaries or lists—`None` should be used
if the intention is to await data for loading later on. A widget can be
constructed from a dataset:

```python
from perspective import PerspectiveWidget
PerspectiveWidget(data, group_by=["date"])
```

.. or a schema:

```python
PerspectiveWidget({"a": int, "b": str})
```

.. or an instance of a `perspective.Table`:

```python
table = perspective.table(data)
PerspectiveWidget(table)
```

<!--
## `PerspectiveRenderer`

Perspective also exposes a JS-only `mimerender-extension`. This lets you view
`csv`, `json`, and `arrow` files directly from the file browser. You can see
this by right clicking one of these files and `Open With->CSVPerspective` (or
`JSONPerspective` or `ArrowPerspective`). Perspective will also install itself
as the default handler for opening `.arrow` files. -->

## `PerspectiveTornadoHandler`

Perspective ships with a pre-built Tornado handler that makes integration with
`tornado.websockets` extremely easy. This allows you to run an instance of
`Perspective` on a server using Python, open a websocket to a `Table`, and
access the `Table` in JavaScript and through `<perspective-viewer>`. All
instructions sent to the `Table` are processed in Python, which executes the
commands, and returns its output through the websocket back to Javascript.

### Python setup

To use the handler, we need to first have a `Server`, a `Client` and an instance
of a `Table`:

```python
SERVER = Server()
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
