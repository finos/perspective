---
id: python
title: Python User Guide
---

Perspective for Python uses the exact same C++ data engine used by the
[WebAssembly version](https://perspective.finos.org/docs/md/js.html). The
library consists of many of the same abstractions and API as in JavaScript, as
well as Python-specific data loading support for [NumPy](https://numpy.org/),
[Pandas](https://pandas.pydata.org/) (and
[Apache Arrow](https://arrow.apache.org/), as in JavaScript).

Additionally, `perspective-python` provides a session manager suitable for
integration into server systems such as
[Tornado websockets](https://www.tornadoweb.org/en/stable/websocket.html), which
allows fully _virtual_ Perspective tables to be interacted with by multiple
`<perspective-viewer>` in a web browser.

As `<perspective-viewer>` will only consume the data necessary to render the
current screen, this runtime mode allows _ludicrously-sized_ datasets with
instant-load after they've been manifest on the server (at the expense of
network latency on UI interaction).

The included `PerspectiveWidget` allows running such a viewer in
[JupyterLab](https://jupyterlab.readthedocs.io/en/stable/) in either server or
client (via WebAssembly) mode, and the included `PerspectiveTornadoHandler`
makes it simple to extend a Tornado server with virtual Perspective support.

The `perspective` module exports several tools:

- `Table`, the table constructor for Perspective, which implements the `table`
  and `view` API in the same manner as the JavaScript library.
- `PerspectiveWidget` the JupyterLab widget for interactive visualization.
- `PerspectiveTornadoHandler`, an integration with
  [Tornado](https://www.tornadoweb.org/) that interfaces seamlessly with
  `<perspective-viewer>` in JavaScript.
- `PerspectiveManager` the session manager for a shared server deployment of
  `perspective-python`.

This user's guide provides an overview of the most common ways to use
Perspective in Python: the `Table` API, the JupyterLab widget, and the Tornado
handler.

For an understanding of Perspective's core concepts, see the
[Table](/docs/md/table.html), [View](/docs/md/view.html), and
[Data Binding](/docs/md/server.html) documentation. For API documentation, see
the [Python API](/docs/obj/perspective-python.html).

[More Examples](https://github.com/finos/perspective/tree/master/examples) are
available on GitHub.

## Installation

`perspective-python` contains full bindings to the Perspective API, a JupyterLab
widget, and a [Tornado](http://www.tornadoweb.org/en/stable/) WebSocket handler
that allows you to host Perspective using server-side Python.

In addition to supporting row/columnar formats of data using `dict` and `list`,
`pandas.DataFrame`, dictionaries of NumPy arrays, NumPy structured arrays, and
NumPy record arrays are all supported in `perspective-python`.

`perspective-python` can be installed from `pip`:

```bash
pip install perspective-python
```

### Jupyterlab

`PerspectiveWidget` is a JupyterLab widget that implements the same API as
`<perspective-viewer>`, allowing for fast, intuitive
transformations/visualizations of various data formats within JupyterLab.

`PerspectiveWidget` is compatible with Jupyterlab 3. To use it, make sure you
have installed `perspective-python` and then install the extension from the
Jupyter lab extension directory:

```bash
jupyter labextension install @finos/perspective-jupyterlab
```

If the widget does not display, you might be missing the
[ipywidgets extension](https://ipywidgets.readthedocs.io/en/latest/user_install.html#installing-the-jupyterlab-extension).
Install it from the extension directory:

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager
```

## `Table`

A `Table` can be created from a dataset or a schema, the specifics of which are
[discussed](#loading-data-with-table) in the JavaScript section of the user's
guide. In Python, however, Perspective supports additional data types that are
commonly used when processing data:

- `pandas.DataFrame`
- `numpy.ndarray`
- `bytes` (encoding an Apache Arrow)
- `objects` (either extracting a repr or via reference)

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

table = perspective.Table(data, index="float")
```

Likewise, a `View` can be created via the `view()` method:

```python
view = table.view(row_pivots=["float"], filter=[["bool", "==", True]])
column_data = view.to_dict()
row_data = view.to_records()
```

### Pandas & Numpy Support

Perspective supports dictionaries of one-dimensional `numpy.ndarray`, as well as
structured arrays and record arrays. When passing in dictionaries of NumPy
arrays, make sure that your dataset contains only NumPy arrays, and not a
mixture of arrays and Python lists — this will raise an exception. Numpy
structured/record arrays are parsed according to their field name and dtype.

`Table` can also be constructed from `pandas.DataFrame` and `pandas.Series`
objects. Because Perspective is designed for applying its own transformations on
top of a flat dataset, dataframes that are passed in will be flattened and have
its `index` treated as another column (through the
[`reset_index()`](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.reset_index.html)
method).

If the dataframe does not have an index set, an integer-typed column named
`"index"` is created. If you want to preserve the indexing behavior of the
dataframe passed into Perspective, simply create the `Table` with
`index="index"` as a keyword argument. This tells Perspective to once again
treat the index as a primary key:

```python
data.set_index("datetime")
table = perspective.Table(data, index="index")
```

### Schemas & Supported Data Types

Unlike JavaScript, where schemas must be created using string representations of
their types, `perspective-python` leverages Python's type system for schema
creation. A schema can be created with the following types:

- `int` (and `long` in Python 2)
- `float`
- `bool`
- `datetime.date`
- `datetime.datetime`
- `str` (and `unicode` in Python 2)
- `object`

#### Loading Custom Objects

Custom objects can also be loaded into Perspective by using `object` in the
schema, or implementing `_psp_repr_` to return `object`. Perspective stores a
reference to your object as an unsigned 64-bit integer (e.g. a pointer), and
uses `__repr__` (or `_psp_repr` if implemented) to represent the object.

You can customize how Perspective extracts data from your objects by
implementing these two methods into your object:

- `_psp_repr_`: Since `__repr__` can only return strings, this lets you return
  other values
- `_psp_dtype_`: Perpspective will look at this to determine how to cast your
  objects' repr.

#### Time Zone Handling

- ["Naive"](https://docs.python.org/3/library/datetime.html#aware-and-naive-objects)
  datetimes are assumed to be local time.
- ["Aware"](https://docs.python.org/3/library/datetime.html#aware-and-naive-objects)
  datetimes use the time zone specified in the `tzinfo`.

All `datetime` columns (regardless of input time zone) are output to the user as
`datetime.datetime` objects in _local time_ according to the Python runtime.

This behavior is consistent with Perspective's behavior in JavaScript. For more
details, see this in-depth
[explanation](https://github.com/finos/perspective/pull/867) of
`perspective-python` semantics around time zone handling.

##### Pandas Timestamps

- Naive `pandas.Timestamp` objects are _always_ treated as UTC times, and will
  be converted to local time when output to the user.
- Aware `pandas.Timestamp` objects use the time zone specified in `tzinfo`. Use
  `tz_localize` or `tz_convert` to provide the `Timestamp` with a time zone.

### Callbacks and Events

`perspective.Table` allows for `on_update` and `on_delete` callbacks to be
set—simply call `on_update` or `on_delete` with a reference to a function or a
lambda without any parameters:

```python
def update_callback():
    print("Updated!")

# set the update callback
view.on_update(update_callback)


def delete_callback():
    print("Deleted!")

# set the delete callback
view.on_delete(delete_callback)

# set a lambda as a callback
view.on_delete(lambda: print("Deleted x2!"))
```

If the callback is a named reference to a function, it can be removed with
`remove_update` or `remove_delete`:

```python
view.remove_update(update_callback)
view.remove_delete(delete_callback)
```

Callbacks defined with a lambda function cannot be removed, as lambda functions
have no identifier.

## `PerspectiveManager`

`PerspectiveManager` offers an interface for hosting multiple
`perspective.Table` and `perspective.View` instances, extending their interfaces
to operate with the [JavaScript library](/docs/md/js.html) over a websocket
connection. `PerspectiveManager` is required to enable `perspective-python` to
[operate remotely](/docs/md/js.html#remote-perspective-via-perspective-python-and-tornado)
using a websocket API.

### Async Mode

By default, `perspective` will run with a synchronous interface. Using the
`PerspectiveManager.set_loop_callback()` method, `perspective` can be configured
to defer the application of side-effectful calls like `update()` to an event
loop, such as `tornado.ioloop.IOLoop`. When running in Async mode, Perspective
will release the GIL for some operations, enabling better parallelism and
overall better server performance. There are a few important differences when
running `PerspectiveManager` in this mode:

- Calls to methods like `update()` will return immediately, and the reciprocal
  `on_update()` callbacks will be invoked on an event later scheduled. Calls to
  other methods which require an up-to-date object, but will still synchronously
  apply the pending update.
- Updates will be _conflated_ when multiple calls to `update()` occur before the
  scheduled application. In such cases, you may receive a single `on_update()`
  notification for multiple `update()` calls.
- Once `set_loop_callback()` has been called, you may not call Perspective
  functions from any other thread.

For example, using Tornado `IOLoop` you can create a dedicated thread for a
`PerspectiveManager`:

```python
manager = perspective.PerspectiveManager()

def perspective_thread():
    loop = tornado.ioloop.IOLoop()
    manager.set_loop_callback(loop.add_callback)
    loop.start()

thread = threading.Thread(target=perspective_thread)
thread.daemon = True
thread.start()
```

### Hosting `Table` and `View` instances

`PerspectiveManager` has the ability to "host" `perspective.Table` and
`perspective.View` instances. Hosted tables/views can have their methods called
from other sources than the Python server, i.e. by a `perspective-viewer`
running in a JavaScript client over the network, interfacing with
`perspective-python` through the websocket API.

The server has full control of all hosted `Table` and `View` instances, and can
call any public API method on hosted instances. This makes it extremely easy to
stream data to a hosted `Table` using `.update()`:

```python
manager = PerspectiveManager()
table = Table(data)
manager.host_table("data_source", table)

for i in range(10):
    # updates continue to propagate automatically
    table.update(new_data)
```

In situations where clients should only be able to view the table and not modify
it through `update`, `delete`, etc., initialize the `PerspectiveManager` with
`lock=True`, or call the `lock()` method on a manager instance:

```python
# lock prevents clients from calling methods that may mutate the state
# of the table.
manager = PerspectiveManager(lock=True)
table = Table(data)
manager.host_table("data_source", table)
```

A `PerspectiveManager` instance can host as many `Table`s and `View`s as
necessary, but each `Table` should only be hosted by _one_ `PerspectiveManager`.

To host a `Table` or a `View`, call the corresponding method on an instance of
`PerspectiveManager` with a string name and the instance to be hosted:

```python
manager = PerspectiveManager()
table = Table(data)
manager.host_table("data_source", table)
```

The `name` provided is important, as it enables Perspective in JavaScript to
look up a `Table` and get a handle to it over the network. This enables several
powerful server/client implementations of Perspective, as explained in the next
section.

### Client/Server Replicated Mode

Using Tornado and
[`PerspectiveTornadoHandler`](/docs/md/python.html#perspectivetornadohandler),
as well as `Perspective`'s JavaScript library, we can set up "distributed"
Perspective instances that allows multiple browser `perspective-viewer` clients
to read from a common `perspective-python` server, as in the
[Tornado Example Project](https://github.com/finos/perspective/tree/master/examples/tornado-python).

This architecture works by maintaining two `Tables`—one on the server, and one
on the client that mirrors the server's `Table` automatically using `on_update`.
All updates to the table on the server are automatically applied to each client,
which makes this architecture a natural fit for streaming dashboards and other
distributed use-cases. In conjunction with [Async Mode](#async-mode),
distributed Perspective offers consistently high performance over large numbers
of clients and large datasets.

_*server.py*_

```python
from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler

# Create an instance of PerspectiveManager, and host a Table
MANAGER = PerspectiveManager()
TABLE = Table(data)

# The Table is exposed at `localhost:8888/websocket` with the name `data_source`
MANAGER.host_table("data_source", TABLE)

app = tornado.web.Application([
    (r"/", MainHandler),
    # create a websocket endpoint that the client JavaScript can access
    (r"/websocket", PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
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
    const websocket = perspective.websocket("ws://localhost:8888/websocket");

    // Get a handle to the Table on the server
    const server_table = websocket.open_table("data_source_one");

    // Create a new view
    const server_view = await table.view();

    // Create a Table on the client using `perspective.worker()`
    const worker = perspective.worker();
    const client_table = await worker.table(view);

    // Load the client table in the `<perspective-viewer>`.
    document.getElementById("viewer").load(client_table);
  });
</script>
```

For a more complex example that offers distributed editing of the server
dataset, see
[client_server_editing.html](https://github.com/finos/perspective/blob/master/examples/tornado-python/client_server_editing.html).

### Server-only Mode

The server setup is identical to [Distributed Mode](#distributed-mode) above,
but instead of creating a view, the client calls `load(server_table)`: In
Python, use `PerspectiveManager` and `PerspectiveTornadoHandler` to create a
websocket server that exposes a `Table`. In this example, `table` is a proxy for
the `Table` we created on the server. All API methods are available on
_proxies_, the.g.us calling `view()`, `schema()`, `update()` on `table` will
pass those operations to the Python `Table`, execute the commands, and return
the result back to Javascript.

```html
<perspective-viewer id="viewer" editable></perspective-viewer>
```

```javascript
const websocket = perspective.websocket("ws://localhost:8888/websocket");
const table = websocket.open_table("data_source_one");
document.getElementById("viewer").load(table);
```

## `PerspectiveWidget`

Building on top of the API provided by `perspective.Table`, the
`PerspectiveWidget` is a JupyterLab plugin that offers the entire functionality
of Perspective within the Jupyter environment. It supports the same API
semantics of `<perspective-viewer>`, along with the additional data types
supported by `perspective.Table`. `PerspectiveWidget` takes keyword arguments
for the managed `View`; additioanl arguments `index` and `limit` will be passed
to the `Table`. For convenience are the
[`Aggregate`](https://github.com/finos/perspective/blob/master/python/perspective/perspective/core/aggregate.py),
[`Sort`](https://github.com/finos/perspective/blob/master/python/perspective/perspective/core/sort.py),
and
[`Plugin`](https://github.com/finos/perspective/blob/master/python/perspective/perspective/core/plugin.py)
enums, which can be used as replacements to string values in the API:

```python
from perspective import PerspectiveWidget, Aggregate, Sort, Plugin
w = perspective.PerspectiveWidget(
    data,
    plugin=Plugin.XBAR,
    aggregates={"datetime": Aggregate.ANY},
    sort=[["date", Sort.DESC]]
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
from perspective import PerspectiveWidget, Table
PerspectiveWidget(data, row_pivots=["date"])
```

.. or a schema:

```python
PerspectiveWidget({"a": int, "b": str})
```

.. or an instance of a `perspective.Table`:

```python
table = Table(data)
PerspectiveWidget(table)
```

.. or `None`:

```python
PerspectiveWidget(None)
```

## `PerspectiveRenderer`

Perspective also exposes a JS-only `mimerender-extension`. This lets you view
`csv`, `json`, and `arrow` files directly from the file browser. You can see
this by right clicking one of these files and `Open With->CSVPerspective` (or
`JSONPerspective` or `ArrowPerspective`). Perspective will also install itself
as the default handler for opening `.arrow` files.

## `PerspectiveTornadoHandler`

Perspective ships with a pre-built Tornado handler that makes integration with
`tornado.websockets` extremely easy. This allows you to run an instance of
`Perspective` on a server using Python, open a websocket to a `Table`, and
access the `Table` in JavaScript and through `<perspective-viewer>`. All
instructions sent to the `Table` are processed in Python, which executes the
commands, and returns its output through the websocket back to Javascript.

### Python setup

To use the handler, we need to first have an instance of a `Table` and a
`PerspectiveManager`. The manager acts as the interface between the JavaScript
and Python layers, implementing a JSON API that allows the two Perspective
runtimes to communicate.

```python
MANAGER = PerspectiveManager()
```

Once the manager has been created, create a `Table` instance and call
`host_table` on the manager with a name, passing through a reference to the
`Table` you just created. `host_table()` registers the Table with the manager
and allows the manager to send instructions to the Table.

The name that you host the table under is important—it acts as a unique accessor
on the JavaScript side, which will look for a Table hosted at the websocket with
the name you specify.

```python
TABLE = Table(data)
MANAGER.host_table("data_source_one", TABLE)
```

After the manager and table setup is complete, create a websocket endpoint and
provide it a reference to `PerspectiveTornadoHandler`. You must provide the
configuration object in the route tuple, and it must contain `manager`, which is
a reference to the `PerspectiveManager` you just created.

```python
app = tornado.web.Application([
    (r"/", MainHandler),
    # create a websocket endpoint that the client JavaScript can access
    (r"/websocket", PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
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
const websocket = perspective.websocket("ws://localhost:8888/websocket");
```

Next open the `Table` we created on the server by name:

```javascript
const table = websocket.open_table("data_source_one");
```

`table` is a proxy for the `Table` we created on the server. All operations that
are possible through the JavaScript API are possible on the Python API as well,
thus calling `view()`, `schema()`, `update()` etc. on `const table` will pass
those operations to the Python `Table`, execute the commands, and return the
result back to JavaScript. Similarly, providing this `table` to a
`<perspective-viewer>` instance will allow virtual rendering:

```javascript
viewer.load(table);
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

The Python runtime does not suffer from memory limitations, utilizes
[TBB](https://github.com/intel/tbb) for threading and parallel processing, and
generates architecture optimized code, which currently makes it more suitable as
a server-side runtime than `node.js`.
