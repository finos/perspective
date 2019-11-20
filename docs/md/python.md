---
id: python
title: Python User Guide
---

The Python library consists of the same abstractions and API as the Javascript
library, along with some Python-specific APIs to support data from NumPy and
Pandas, as well as an integration with
[`tornado.websocket`](https://www.tornadoweb.org/en/stable/websocket.html).

Organizationally, the library is split into two main sections:

- `perspective.table`, which implements the `table` and `view` API in the same
  manner as the Javascript library.
- `perspective.core`, which contains the JupyterLab `PerspectiveWidget`, an
  implementation of the `<perspective-viewer>` API in `PerspectiveViewer`, and
  `PerspectiveTornadoHandler` for use with Tornado websockets.

This user's guide provides an overview of the most common ways to use
Perspective in Python: the `Table` API, the JupyterLab widget, and the Tornado
handler.

For more detailed API documentation, see the `API` section of this site or refer
to docstrings through the `help()` function in Python.

## `perspective.Table`

A `perspective.Table` can be created from a dataset or a schema, the specifics
of which are [discussed](#loading-data-with-table) in the Javascript section of
the user's guide. In Python, however, Perspective supports additional data types
that are commonly used when processing data:

- `pandas.DataFrame`
- `numpy.ndarray`
- NumPy Structured Arrays & Record Arrays

A `Table` is created in a similar fashion to its Javascript equivalent:

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

And so is the `View`:

```python
view = table.view(row_pivots=["float"], filter=[["bool", "==", True]])
column_data = view.to_dict()
row_data = view.to_records()
```

Instead of passing in `config` as an object, however, you can use keyword
arguments to configure both the Table and the View.

## Numpy Support

Perspective supports dictionaries of 1-dimensional `numpy.ndarray`, as well as
structured arrays and record arrays. Multi-dimensional arrays are not supported
at this time.

When passing in dictionaries of NumPy arrays, make sure that your dataset
contains _ONLY_ NumPy arrays, and not a mixture of arrays and Python lists—this
will raise an exception.

Numpy structured/record arrays are parsed according to their field name and
dtype.

## Pandas Support

Perspective supports `pandas.DataFrame` and `pandas.Series` objects. Because
Perspective is designed for applying its own transformations on top of a flat
dataset, dataframes that are passed in will be flattened and have its `index`
treated as another column (through the
[`reset_index`](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.reset_index.html)
method).

If the dataframe does not have an index set, an integer-typed column named
"index" is created

If you want to preserve the indexing behavior of the dataframe passed into
Perspective, simply create the `Table` with `index="index"` as a keyword
argument. This tells Perspective to once again treat the index as a primary key:

```python
data.set_index("datetime")
table = perspective.Table(data, index="index")
```

## Schemas & Supported Data Types

Unlike Javascript, where schemas must be created using string representations of
their types, `perspective-python` leverages Python's type system for schema
creation.

A schema can be created with the following types:

- `int` (and `long` in Python 2)
- `float`
- `bool`
- `datetime.date`
- `datetime.datetime`
- `str` (and `unicode` in Python 2)

Once the `Table` has been created with a schema, however, Perspective will cast
the data that it ingests to conform with the schema. This allows for a lot of
flexibility; a column that is typed as a `datetime`, for example, can be updated
with `date` objects, `datetime` objects, `pandas.Timestamp`, `numpy.datetime64`,
and even valid millisecond/seconds from epoch timestamps. Similarly, updating
string columns with integer data will cause a cast to string, updating floats
with ints cause a float cast, and etc.

Type inferrence works similarly—a column that contains `pandas.Timestamp`
objects will have its type inferred as `datetime`, which allows it to be updated
with any of the datetime types that were just mentioned. Thus, Perspective is
aware of the basic type primitives that it supports, but agnostic towards the
actual Python `type` of the data that it receives.

### Callbacks and Events

`perspective.Table` allows for `on_update` and `on_delete` callbacks to be
set—simply call `on_update` or `on_delete` with a reference to a function or a
lambda without any parameters:

```python
def callback():
    print("Updated!")
view.on_update(callback)
view.on_delete(lambda: print("Updated again!"))
```

If the callback is a named reference to a function, it can be removed with
`remove_update` or `remove_delete`. Callbacks defined with a lambda function
cannot be removed at this time.

```python
view.remove_update(callback)
```

### Exception Handling

Perspective raises two classes of exceptions:

- `PerspectiveError`, which is raised from Python
- `PerspectiveCppError`, which is raised from the C++ binding

To handle all exceptions that are explicitly raised by Perspective simply run:

```python
from perspective import PerspectiveError, PerspectiveCppError
```

## `perspective.PerspectiveWidget`

Building on top of the API provided by `perspective.Table`, the
`PerspectiveWidget` is a JupyterLab plugin that offers the entire functionality
of Perspective within the Jupyter environment. It supports the same API
semantics of `<perspective-viewer>`, along with the additional data types
supported by `perspective.Table`.

Additionally, when created with `client=true` as a keyword argument to
`__init__`, it can be used without accessing the built C++ binary.

## Client Mode

For certain systems, it may be difficult or infeasible to build the C++ library
for Perspective, which `perspective.Table` depends on. However, we can leverage
`Perspective.js` in the browser to provide the same widget experience to users.
If created with `client=true`, `PerspectiveWidget` will serialize the data to
the best of its ability and pass it off to the browser's Perspective engine to
load.

If `perspective-python` cannot find the built C++ libraries, it automatically
defaults to client mode when initializing the widget.

## `PerspectiveWidget.__init__`

Similar to the viewer API, `__init__` takes keyword arguments that transform the
`View` under management by the `PerspectiveWidget`:

- `plugin`
- `row_pivots`
- `column_pivots`
- `columns`
- `aggregates`
- `sort`
- `filters`

Arguments that will be passed to the `perspective.Table` constructor if a
dataset or schema is passed in:

- [`index`](#index-and-limit)
- [`limit`](#index-and-limit)

As well as keyword arguments specific to `PerspectiveWidget` itself:

- `client`: a boolean that determines whether the Widget will depend on
  `perspective.Table` in Python, or if it sends data to the front-end WASM
  engine for processing.

Several Enums are provided to make lookup of specific plugin types, aggregate
types, etc. much easier:

- [`Aggregate`](https://github.com/finos/perspective/blob/master/python/perspective/perspective/core/aggregate.py)
  : aggregate operations
- [`Sort`](https://github.com/finos/perspective/blob/master/python/perspective/perspective/core/sort.py)
  : sort directions
- [`Plugin`](https://github.com/finos/perspective/blob/master/python/perspective/perspective/core/plugin.py)
  : plugins (grid/chart types, etc.)

These can be used as replacements to string values in the API:

```python
from perspective import PerspectiveWidget, Aggregate, Sort, Plugin
w = perspective.PerspectiveWidget(
    data, plugin=Plugin.XBAR, aggregates={"datetime": Aggregate.ANY})
w.sort = [["date", Sort.DESC]]
```

## Creating a widget

A widget is created through the `PerspectiveWidget` constructor, which takes as
its first, required parameter a `perspective.Table`, a dataset, a schema, or
`None`, which serves as a special value that tells the Widget to defer loading
any data until later. In maintaining consistency with the Javascript API,
Widgets cannot be created with empty dictionaries or lists—`None` should be used
if the intention is to await data for loading later on.

A widget can be constructed from a dataset:

```python
from perspective import PerspectiveWidget, Table
widget = PerspectiveWidget(data, row_pivots=["date"])
```

Or a schema:

```python
widget = PerspectiveWidget({"a": int, "b": str})
```

Or an instance of a `perspective.Table`:

```python
table = Table(data)
widget = PerspectiveWidget(table)
```

Or `None`:

```python
widget = PerspectiveWidget(None)
```

Once the widget has been created, simply call it in order to render the widget's
front-end `<perspective-viewer>`:

```python
widget
```

## `load()`

Calling `load()` on the widget provides it with a dataset. If the widget already
has a dataset, and the new data has different columns to the old one, then the
widget state (pivots, sort, etc.) is cleared to prevent applying settings on
columns that don't exist.

Like `__init__`, load accepts a `perspective.Table`, a dataset, or a schema. If
running in client mode, `load` defers to the browser's Perspective engine. This
means that loading Python-only datasets, especially ones that cannot be
serialized into JSON, may cause some issues.

```python
widget = PerspectiveWidget(None)
widget.load(data)
```

## `update()`

Call `update()` on the widget to update it with new data. When called in client
mode, this method serializes the data and passes it off to the Perspective
engine running in the browser.

```python
widget.update(data)
```

### `clear()` and `replace()`

Calling `clear()` on the widget will remove all data from the underlying
`Table`, but preserve all user-applied settings to the widget.

```python
widget.clear()
widget.table.size() # True
```

Calling `replace(data)` on the widget with new data will remove the table's old
data, and replace it with the new dataset, while preserving all widget state.

```python
widget.replace(df2)
```

Both methods do not change the schema of the Table, so new data must conform to
the schema.

### `reset()`

Call `reset()` on the widget to return it to an unpivoted, unmodified state. The
`Table` that contains the widget's data is not affected.

```python
widget = PerspectiveWidget(data, row_pivots=["date"], plugin=Plugin.XBAR)
widget.reset()
widget.plugin  # "hypergrid"
```

## `PerspectiveTornadoHandler`

Perspective ships with a pre-built Tornado handler that makes integration with
`tornado.websockets` extremely easy. This allows you to run an instance of
`Perspective` on a server using Python, open a websocket to a `Table`, and
access the `Table` in Javascript and through `<perspective-viewer>`.

All instructions sent to the `Table` are processed in Python, which executes the
commands, and returns its output through the websocket back to Javascript.

### Python setup

To use the handler, we need to first have an instance of a `Table` and a
`PerspectiveManager`—the manager acts as the interface between the Javascript
and the Python layers, implementing a JSON API that allows the two Perspective
runtimes to communicate.

```python
MANAGER = PerspectiveManager()
```

Once the manager has been created, create a `Table` instance and call
`host_table` on the manager with a name, passing through a reference to the
`Table` you just created. `host_table()` registers the Table with the manager
and allows the manager to send instructions to the Table.

The name that you host the table under is important—it acts as a unique accessor
on the Javascript side, which will look for a Table hosted at the websocket with
the name you specify.

```python
TABLE = Table(data)
MANAGER.host_table("data_source_one", TABLE)
```

After the manager and table setup is complete, create a websocket endpoint and
provide it a reference to PerspectiveTornadoHandler. You must provide the
configuration object in the route tuple, and it must contain `manager`, which is
a reference to the `PerspectiveManager` you just created.

```python
app = tornado.web.Application([
    (r"/", MainHandler),
    # create a websocket endpoint that the client Javascript can access
    (r"/websocket", PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
])
```

Optionally, the configuration object can also include `check_origin`, a boolean
that determines whether the websocket accepts requests from origins other than
where the server is hosted. See
[Tornado docs](https://www.tornadoweb.org/en/stable/websocket.html#tornado.websocket.WebSocketHandler.check_origin)
for more details.

### Javascript setup

Once the server is up and running, you can access the Table you just hosted
using `perspective.websocket` and `open_table()`:

```javascript
// Create a client that expects a Perspective server to accept connections at the specified URL.
const websocket = perspective.websocket("ws://localhost:8888/websocket");

/* `table` is a proxy for the `Table` we created on the server.

All operations that are possible through the Javascript API are possible on the Python API as well,
thus calling `view()`, `schema()`, `update()` etc on `const table` will pass those operations to the
Python `Table`, execute the commands, and return the result back to Javascript.
*/
const table = websocket.open_table("data_source_one");

// Load this in the `<perspective-viewer>`.
viewer.load(table);
viewer.toggleConfig();
```

`perspective.websocket` expects a Websocket URL where it will send instructions.
When `open_table` is called, the name to a hosted Table is passed through, and a
request is sent through the socket to fetch the Table. No actual Table instance
is passed inbetween the runtimes; all instructions are proxied through
websockets.

This provides for great flexibility—while `Perspective.js` is full of features,
WASM runtimes have a hard 2GB memory limit, and cannot process instructions in
parallel. The Python runtime does not suffer from any memory limits, and
utilizes [TBB](https://github.com/intel/tbb) for threading and parallel
processing, which makes it more suitable as a server-side runtime.
