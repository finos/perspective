---
id: js
title: Javascript User Guide
---

Perspective's Javascript library offers a flexible, intuitive UI on top of a
fast, powerful streaming data engine. Developers are able to pick and
choose the modules they require for their use case, and users are presented
with a clean user interface through which to analyze data.

This document offers an overview of the Javascript library, providing:

- A quick start guide for integrating Perspective in your application
- An overview of Perspective's module structure
- Details about Perspective's various features

For understanding Perspective's core concepts and vocabulary, see the
[Conceptual Overview](/docs/md/concepts.html).

For example code, see the [examples directory](https://github.com/finos/perspective/tree/master/examples)
on GitHub.

## Quick Start

First, make sure that Perspective [is installed](/docs/md/installation.html),
and that you have the library accessible through your Javascript bundler.

If Perspective was added using a script tag, see the
[From CDN](/docs/md/installation.html#from-cdn) section of the installation
notes for a quick example.

### Importing `perspective-viewer`

To integrate Perspective with an existing data source in your application,
you'll need to import the following modules:

```javascript
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
```

`perspective-viewer` provides a widget for users to transform and analyze
their data, while `perspective-viewer-datagrid` and `perspective-viewer-d3fc`
provide fast, flexible grid and chart visualization plugins, respectively.

These modules register the `<perspective-viewer>`
[Web Component](https://www.webcomponents.org/introduction) for use within
your application's HTML:

```html
<perspective-viewer id="view1"></perspective-viewer>
```

### Loading data

`<perspective-viewer>` offers an attribute API that can be accessed through a
reference to the HTML element:

```javascript
const viewer = document.getElementsByTagName("perspective-viewer")[0];
```

Use the viewer's `load()` method to provide it with data in JSON, CSV, or
Apache Arrow format:

```javascript
const data = getData(); // returns a Javascript object
viewer.load(data); // loads the data in `perspective-viewer`
```

### Updating data

When your dataset updates with new information, call the viewer's `update()`
method in order to update `perspective-viewer`. There is no need to refresh or
re-create the viewer, or to accumulate your data elsewhere, as Perspective will
handle everything for you:

```javascript
// Assume that new ticks are delivered via websocket
websocket.onmessage = function(event) {
    viewer.update(event.data);
};
```

### Configuring `perspective-viewer`

`<perspective-viewer>` defaults to showing a grid view of the entire dataset
without any transformations applied. To configure your viewer to show a
different visualization on load or transform the dataset, use the viewer's attribute API:

```html
<perspective-viewer
  id="view1"
  plugin="xy_scatter"
  columns='["Sales", "Profits"]'
  row_pivots='["State", "City"]'
>
</perspective-viewer>
```

For more details about the full attribute API, see the
[`<perspective-viewer>`](/js.html#setting--reading-viewer-configuration-via-attributes)section of this user guide.

## Module Structure

Perspective is designed for flexibility, allowing developers to pick and choose
which modules they need for their specific use case. The main modules are:

- `@finos/perspective`  
  The data engine library, as both a browser ES6 and Node.js module. Provides a
  WebAssembly, WebWorker (browser) and Process (node.js) runtime.

- `@finos/perspective-viewer`  
  A user-configurable visualization widget, bundled as a
  [Web Component](https://www.webcomponents.org/introduction). This module
  includes the core data engine module as a dependency.

`<perspective-viewer>` by itself only implements a trivial debug renderer, which
prints the currently configured `view()` as a CSV. Plugin modules for popular
Javascript libraries such as [d3fc](https://d3fc.io/) are packaged separately
and must be imported individually.

Perspective offers these plugin modules:

- `@finos/perspective-viewer-datagrid`  
  A custom high-performance data-grid component based on HTML `<table>`.

- `@finos/perspective-viewer-d3fc`  
  A `<perspective-viewer>` plugin for the [d3fc](https://d3fc.io) charting
  library.

Also available are these legacy modules; though no longer under development,
they are compatible with perspective versions < 1.0.0:

- `@finos/perspective-viewer-hypergrid`  
  A `<perspective-viewer>` plugin for
  [Hypergrid](https://github.com/fin-hypergrid/core).

- `@finos/perspective-viewer-highcharts`  
  [DEPRECATED] A `<perspective-viewer>` plugin for
  [HighCharts](https://github.com/highcharts/highcharts). This plugin has a
  `highcharts` as a peerDependency, and requires a
  [mixed commercial license](https://shop.highsoft.com/).

When imported after `@finos/perspective-viewer`, the plugin modules will
register themselves automatically, and the renderers they export will be
available in the `view` dropdown in the `<perspective-viewer>` UI.

Developers can choose to opt into the features, bundle size inflation and
licensing for these dependencies as needed.

### What modules should I import?

Depending on your requirements, you may need just one, or all Perspective
modules. Some basic guidelines to help you decide what is most appropriate for
your project:

- For Perspective as a simple, browser-based data visualization widget, import:

  - `@finos/perspective-viewer`, detailed [here](#perspective-viewer-web-component)
  - `@finos/perspective-viewer-datagrid` for data grids
  - `@finos/perspective-viewer-d3fc` for charting
  - The core data engine `@finos/perspective` is a dependency of these packages
    and does not need to be imported on its own for basic usage.

- For Perspective's high-performance streaming data engine (in WebAssembly), or
  for a purely Node.js based application, import:

  - `@finos/perspective`, as detailed [here](#perspective-library)

- For more complex cases, such as
  [sharing tables between viewers](#sharing-a-table-between-multiple-perspective-viewers)
  and
  [binding a viewer to a remote view in Node.js](#remote-perspective-via-workerhost), you will likely need all Perspective modules.

## `perspective` library

As a library, `perspective` provides a suite of streaming pivot, aggregate,
filter and sort operations for tabular data. The engine can be instantiated in
process, or in a Web Worker (browser only); in both cases, `perspective` exports
a nearly identical API.

It exports Perspective's data interfaces:

- `table()`: an interface over a single dataset, used to input static and
  streaming data into Perspective.
  - In the browser, `table()`s live in a Web Worker to isolate their runtime
    from the renderer.
- `view()`: a continuous query of a `table()`, used to read data and calculate
  analytics from a `table()`.
  - `view()`s also live in a Web Worker when used in a browser.
  - A single `table()` may have many `view()`s attached at once.

`@finos/perspective` also exports process management functions such as
`worker()` and `websocket()` (in the browser) and `WebSocketServer()`
(in node.js). See the [API documentation](/obj/perspective.html) for a complete
reference on all exported methods.

This module is a dependency of `@finos/perspective-viewer`, and is not needed if
you only intend to use `<perspective-viewer>` to visualize simple data.

### Importing in the browser

`perspective` can be imported as an ES6 module and/or `require` syntax if you're
using a bundler such as Webpack (and the `@finos/perspective-webpack-plugin`):

```javascript
import perspective from "@finos/perspective";
```

or

```javascript
const perspective = require("@finos/perspective");
```

`@finos/perspective` also comes with a pre-built bundle which exports the global
`perspective` module name in vanilla Javascript, when e.g. importing
[via a CDN](/docs/md/installation.html#from-cdn).

```html
<script src="perspective.js"></script>
```

#### Instantiating a new `worker()`

Once imported, you'll need to instantiate a `perspective` engine via the
`worker()` method. This will create a new WebWorker (browser) or
Process (Node.js), and load the WebAssembly binary; all calculation and data
accumulation will occur in this separate process.

```javascript
const worker = perspective.worker();
```

The `worker` symbol will expose the full `perspective` API for one managed Web
Worker process. You are free to create as many as your browser supports, but be
sure to keep track of the `worker` instances themselves, as you'll need them to
interact with your data in each instance.

### Importing in Node.js

The Node.js runtime for the `@finos/perspective` module runs in-process by
default, and does not implement a `child_process` interface. Hence, there is no
`worker()` method, and the module object itself directly exports the full
`perspective` API.

```javascript
const perspective = require("@finos/perspective");
```

### Loading data with `table()`

The basic data primitive of `perspective` is the `table`, which you can
instantiate via the `table()` method on a `worker`. Further data can be supplied
to the table via its `update()` method.

```javascript
// With data (also works with strings in CSV format)
var data = [
    {x: 1, y: "a", z: true},
    {x: 2, y: "b", z: false},
    {x: 3, y: "c", z: true},
    {x: 4, y: "d", z: false}
];

const table1 = worker.table(data);
```

`table()`s are columnar data structures, and each column must have a single
type. When passing data directly to the `table()` constructor, the type of each
column is inferred automatically.

Perspective supports the following types:

- integer
- float
- boolean
- date
- datetime
- string

In some cases, the inference algorithm may not return exactly what you'd like.
For example, a column may be interpreted as a `datetime` when you intended it to
be a `string`, or a column may have no values at all (yet), as it will be
updated with values from a real-time data source later on.

In these cases, create a `table()` with a _schema_:

```javascript
// With a schema
var schema = {
    x: "integer",
    y: "string",
    z: "boolean"
};

const table2 = worker.table(schema);
```

Once instantiated, a `table()` can be updated with new data via the `update()`
method:

```javascript
// Add a new row to each table
table1.update([{x: 5, y: "e", z: true}]);
table2.update([{x: 5, y: "e", z: true}]);
```

New data is appended by default. In-place updates can be enabled through the
use of `index` and `limit`, as explained in the next sections.

#### Primary keys via `index`

The `table()` method can be initialized with an options object, which accepts
`index` - a column in the dataset that will be used as a primary key on the
table:

```javascript
// Use the 'x' column as a primary key
const table3 = worker.table(
    {
        x: [1, 2, 3, 4],
        y: ["a", "b", "c", "d"]
    },
    {index: "x"}
);
```

If an index is set, the `update()` method uses the index to _replace_ or
_append_ rows:

```javascript
// Replace the values at index 1 and 4
table3.update({
    x: [1, 4],
    y: ["new1", "new2"]
});

// append these rows, as the value in `x` is not an existing primary key
table3.update({
    x: [5, 6],
    y: ["e", "f"]
});
```

#### Row limits via `limit`

Mutually exclusive to `index`, you may limit the total number of rows in a
`table()` via the `limit` property, which preserves only the most recently added
rows.

```javascript
// Keep only the most recent 1000 rows
const table3 = worker.table(data, {limit: 1000});
```

Appended rows that exceed the `limit` overwrite old rows starting at position 0.

#### Unset values via `null`

Any value on a `table()` can be unset using the Javascript value `null`.

Values may be unset on construction, as any `null` in the dataset will be
treated as an unset value. Values can also be explicitly unset via `update()`
on a `table()` with `index` applied:

```javascript
// Unsets the 'y' column for row 3
table.update([{x: 3, y: null}]);
```

#### Partial row updates via `undefined`

`update()` calls do not need values for _all columns_ in the `table()` schema.
Missing keys, or keys with values set to `undefined`, will be omitted from
`table()`s with `index` set, or populated with `null` otherwise:

```javascript
// Only updates the 'y' column for row 3, leaving the 'z' column alone
table.update([{x: 3, y: "Just Y"}]);
```

#### Deleting rows with `remove()`

Rows can be removed entirely from a `table()` with `index` set. Call the
`remove()` method with a list of the `index` values to be removed:

```javascript
// Remove rows indexed with values 1 and 2
table.remove([1, 2]);
```

Calling `remove()` on an unindexed `table()` has no effect.

### Querying data with `view()`

To query the table, create a `view()` on the table instance with an optional
configuration object:

```javascript
const table = worker.table(data);

const view = table.view({
    columns: ["Sales"],
    aggregates: {Sales: "sum"},
    row_pivot: ["Region", "Country"],
    filter: [["Category", "in", ["Furniture", "Technology"]]]
});
```

A `table()` can have as many `view()`s associated with it as you need -
Perspective conserves memory by relying on a single `table()` to power
multiple `view()`s concurrently.

For a detailed description of the `view()`'s configuration object, see the
[API documentation](/docs/obj/perspective.html).

#### Serializing data using `to_*()`

The `view()` allows for serialization of data to the user through the
`to_json()`, `to_columns()`, `to_csv()`, and `to_arrow()` methods. These
methods return a `promise` for the calculated data:

```javascript
// Via standard `promise`
view.to_json().then(json => console.log(json));
view.to_columns().then(json => console.log(json));
view.to_csv().then(csv => console.log(csv));
view.to_arrow().then(arrow => console.log(arrow));

// Via ES6 await/async
async function print_data() {
    console.log(await view.to_json());
    console.log(await view.to_columns());
    console.log(await view.to_csv());
    console.log(await view.to_arrow());
}
```

### Deleting a `table()` or `view()`

Unlike standard Javascript objects, Perspective objects such as `table()` and
`view()` store their associated data in the WebAssembly heap. Due of this, and
the current lack of a hook into the Javascript runtime's garbage collector from
WebAssembly, the memory allocated to these Perspective objects does not
automatically get cleaned up when the object falls out of scope.

In order to prevent memory leaks and reclaim the memory associated with a
Perspective `table()` or `view()`, you must call the `delete()` method:

```javascript
view.delete();

// This method will throw an exception if there are still `view()`s depending
// on this `table()`!
table.delete();
```

### Flattening a `view()` into a `table()`

A `table()` can be constructed on a `view()` instance, which will return a
new `table()` based on the `view()`'s dataset, and all future updates that
affect the `view()` will be forwarded to the new `table()`:

```javascript
// Create two WebWorkers.
const worker1 = perspective.worker();
const worker2 = perspective.worker();

// Create a `table and `view` on `worker1`.
const table = worker1.table(data);
const view = table.view({filter: [["State", "==", "Texas"]]});

// Create a table from `view` in `worker2`
const table2 = worker2.table(view);
const view2 = table2.view({filter: [["City", "==", "Austin"]]});

//  Both `view1` and `view2` are updated.
table.update([{State: "Texas", City: "Austin"}]);

//  Only `view1` is updated.
table.update([{State: "Texas", City: "San Antonio"}]);
```

This is especially useful for piping together `perspective` data from
different contexts, such as streaming a server-side `view()` in Node.js into a
`table()` in a WebWorker on the browser-side.

### Customizing behavior with `perspective.config.js`

For ease of configuration synchronization between the Node.js, WebWorker and
Browser, Perspective supports configuration statically.

You may override Perspective's [default settings](https://github.com/finos/perspective/blob/master/packages/perspective/src/js/config/settings.js)
via a `perspective.config.js` or `perspective.config.json` file in your
project's root or parent path, or via the `"perspective"` key in your project's
`package.json`.

Note that, while in Node.js this config file is read at runtime, for the browser
this file must be read at compile time (handled automatically via
[`@finos/perspective-webpack-plugin`](https://github.com/finos/perspective/tree/master/packages/perspective-webpack-plugin)).

Thus, to update it you must either rebuild your code, or supply the JSON
configuration object to the `worker()` constructor on initialization.

```javascript
module.exports = {
    types: {
        string: {
            aggregate: "dominant"
        },
        float: {
            format: {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        }
    }
};
```

#### Creating new types

For customizing the behavior or style of specific columns, Perspective supports
the definition of new types that derive from an existing built-in type.
First, add a new type and declare its base in your `perspective.config.js`:

```javascript
module.exports = {
    types: {
        price: {type: "float"}
    }
};
```

Perspective will not infer these types for you, so you'll need to create your
table [from a schema](#loading-data-with-table) to use them:

```javascript
const table = worker.table({volume: "integer", price: "price"});
table.update([{volume: 10, price: 100.75}]);
```

#### Formatting data types

Default and user-created types can be styled using the `format` key in
`perspective.config.js`:

```javascript
module.exports = {
    types: {
        price: {
            type: float,
            format: {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        }
    }
};
```

## `perspective-viewer` web component

`<perspective-viewer>` provides a complete graphical UI for configuring the
`perspective` library and formatting its output to the provided visualization
plugins.

If you are using babel or another build environment which supports ES6 modules,
you only need to import the `perspective-viewer` libraries somewhere in your
application - these modules export nothing, but rather register the components
for use within your site's regular HTML:

```javascript
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
```

While each plugin module by default will register all of its visualization
types, you may choose to import these individually as well:

```javascript
import "@finos/perspective-viewer-d3fc/bar";
import "@finos/perspective-viewer-d3fc/column";
import "@finos/perspective-viewer-d3fc/xy-scatter";
```

Once imported, the `<perspective-viewer>` Web Component will be available in any
standard HTML on your site. A simple example:

```html
<perspective-viewer id="view1"></perspective-viewer>
```

### Theming

Theming is supported in `perspective-viewer` and its accompanying plugins.
A number of themes come bundled with `perspective-viewer`, and you can import
any of these themes directly into your app and the `perspective-viewer`s
will be themed accordingly:

```javascript
//Themes based on Google's Material Design Language
import "@finos/perspective-viewer/themes/material.css";
import "@finos/perspective-viewer/themes/material.dark.css";
import "@finos/perspective-viewer/themes/material-dense.css";
import "@finos/perspective-viewer/themes/material-dense.dark.css";

//Vaporwave theme
import "@finos/perspective-viewer/themes/vaporwave.css";
```

***Note that importing multiple themes may override each other***

Alternatively, you may use `all-themes.css`, which exposes all available
themes as CSS classes. This allows you to trivially apply different themes
to multiple `perspective-viewer`s by simply setting the `class`
attribute on each `perspective-viewer`:

_*index.js*_

```javascript
//Exposes all themes as CSS classes
import "@finos/perspective-viewer/themes/all-themes.css";
```

_*index.html*_

```html
<perspective-viewer class="perspective-viewer-material"></perspective-viewer>
<perspective-viewer class="perspective-viewer-material-dark"></perspective-viewer>
<perspective-viewer class="perspective-viewer-material-dense"></perspective-viewer>
<perspective-viewer class="perspective-viewer-material-dense-dark"></perspective-viewer>
<perspective-viewer class="perspective-viewer-vaporwave"></perspective-viewer>
```

If you choose not to bundle the themes yourself, they are available through
the [unpkg.com](https://unpkg.com/@finos/perspective-viewer/dist/umd/).

These can be directly linked in your HTML:

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@finos/perspective-viewer/dist/umd/material.css"
/>
```

### Loading data into `<perspective-viewer>`

Data can be loaded into `<perspective-viewer>` using the `load()` method in
Javascript with JSON, CSV, or an `ArrayBuffer` in the Apache Arrow format.

If `perspective-viewer` is imported via an inline `<script>` tag, you must wait
for the document `WebComponentsReady` event to fire, which indicates that the
provided
[webcomponents.js polyfill](https://github.com/webcomponents/webcomponentsjs)
has loaded:

```javascript
document.addEventListener("WebComponentsReady", function() {
    var data = [
        {x: 1, y: "a", z: true},
        {x: 2, y: "b", z: false},
        {x: 3, y: "c", z: true},
        {x: 4, y: "d", z: false}
    ];

    var viewer = document.getElementById("view1");
    viewer.load(data);

    // Add new row
    viewer.update([{x: 5, y: "e", z: true}]);
});
```

In some situations, you may want finer grained control over the `table()`
construction (see below), and `<perspective-viewer>`'s `load()` method also
supports loading `table()`s directly.

Remember to import the `perspective.js` library also, or the `perspective`
symbol will not be available. Alternatively, you can use the `worker` property
on a `<perspective-viewer>` instance to get the default worker singleton
instantiated when another is not provided:

```javascript
// Create a new worker, then a new table on that worker.
var table = perspective.worker().table(data);

// Bind a viewer element to this table.
viewer.load(table);
```

### Sharing a `table()` between multiple `perspective-viewer`s

Multiple `perspective-viewer`s can share a `table()` by passing the `table()`
into the `load()` method of each viewer. Each `perspective-viewer` will update
when the underlying `table()` is updated, but `table.delete()` will fail until
all `perspective-viewer` instances referencing it are also deleted:

```javascript
var view1 = document.getElementById("view1");
var view2 = document.getElementById("view2");

// Create a new Web Worker
var worker = perspective.worker();

// Create a table in this worker
var table = worker.table(data);

// Load the same table in 2 different <perspective-viewer>s
view1.load(table);
view2.load(table);

// Both `view1` and `view2` will reflect this update
table.update([{x: 5, y: "e", z: true}]);
```

### Remote Perspective via `WebSocketServer()` and Node.js

For exceptionally large datasets, a `<perspective-viewer>` can be bound to a
`perspective.table()` instance running in node.js remotely, rather than creating
one in a Web Worker and downloading the entire data set. This trades off network
bandwidth and server resource requirements, for a smaller browser memory and CPU
footprint.

In Node.js:

```javascript
const {WebSocketServer, table} = require("@finos/perspective");
const fs = require("fs");

// Start a WS/HTTP host on port 8080.  The `assets` property allows
// the `WebSocketServer()` to also serves the file structure rooted in this
// module's directory.
const host = new WebSocketServer({assets: [__dirname], port: 8080});

// Read an arrow file from the file system and load it as a named table.
const arr = fs.readFileSync(__dirname + "/superstore.arrow");
const tbl = table(arr);
host.host_table("table_one", tbl);

// Or host a view
const view = tbl.view({filter: [["State", "==", "Texas"]]});
host.host_view("view_one", view);
```

In the browser:

```javascript
const elem = document.getElementsByTagName("perspective-viewer")[0];

// Bind to the server's worker instead of instantiating a Web Worker.
const websocket = perspective.websocket(window.location.origin.replace("http", "ws"));

// Bind the viewer to the preloaded data source.  `table` and `view` objects
// live on the server.
elem.load(websocket.open_table("table_one"));

// Or load data from a view.  The browser now also has a copy of this view in
// its own `table`, as well as its updates.  Transfer uses Arrows.
elem.load(websocket.open_view("view_one"));
```

`<perspective-viewer>` instances bound in this way are otherwise no different
than `<perspective-viewer>`s which rely on a Web Worker, and can even share a
host application with Web Worker bound `table()`s. The same `promise` based API
is used to communicate with the server instantiated `view()`, only in this case
it is over a Web Socket.

### Remote Perspective via `perspective-python` and Tornado

`perspective-python` is designed to be cross-compatible with the `perspective`
and `perspective-viewer` libraries. Similar to `WebsocketServer` in Node.js,
`perspective-python` runs on the server without any memory limits, reducing
resource usage in the browser. For more detailed documentation on the Python
API, see the [Python user guide](/docs/md/python.html) or the [Python API documentation](/docs/obj/perspective-python.html).

The simplest implementation uses Tornado as a websocket server in Python,
hosting an endpoint at which a `table()` can be accessed:

_*server.py*_

```python
from perspective import Table, PerspectiveManager, PerspectiveTornadoHandler

# Create an instance of PerspectiveManager, and host a Table
MANAGER = PerspectiveManager()
TABLE = Table(large_dataset)

# The Table is exposed at `localhost:8888/websocket` with the name `data_source`
MANAGER.host_table("data_source", TABLE)

app = tornado.web.Application([
    (r"/", MainHandler),
    # create a websocket endpoint that the client Javascript can access
    (r"/websocket", PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
])

# Start the Tornado server
app.listen(8888)
loop = tornado.ioloop.IOLoop.current()
loop.start()
```

The Javascript implementation of this does not require Webpack or any bundler,
and can be achieved in a single HTML file:

_*index.html*_

```html
<perspective-viewer id="viewer" editable></perspective-viewer>

<script>
  window.addEventListener("WebComponentsReady", async function () {
    // Create a client that expects a Perspective server
    // to accept connections at the specified URL.
    const websocket = perspective.websocket("ws://localhost:8888/websocket");

    /* `table` is a proxy for the `Table` we created on the server.

        All operations that are possible through the Javascript API are possible
        on the Python API as well, thus calling `view()`, `schema()`, `update()`
        etc. on `const table` will pass those operations to the Python `Table`,
        execute the commands, and return the result back to Javascript.*/
    const table = websocket.open_table("data_source_one");

    // Load this in the `<perspective-viewer>`.
    document.getElementById("viewer").load(table);
  });
</script>
```

Any operation performed on the `<perspective-viewer>` instance or on
`const table` will be forwarded to Python, which will execute the operation and
return the results back to Javascript.

### Setting & reading `perspective-viewer` configuration via attributes

`<perspective-viewer>` uses the DOM's regular attribute API to set it's initial
state, by reading JSON encoded properties from attributes for each `perspective`
configuration property.

For example, this HTML will apply `row_pivot` and `filter` configuration to the
initial `view()` created when data is loaded via the `load()` method, as well
as set the UI controls to reflect this config. See the
[full Attribute API documentation](/docs/obj/perspective-viewer.html)
for a full description of the available attributes.

```html
<perspective-viewer
  row-pivots='["Category","Sub-Category"]'
  filters='[["State","==","Texas"]]'
>
</perspective-viewer>
```

Attributes on a `<perspective-viewer>` are reactive. When the user interacts
with the viewer, the attributes update to reflect the current viewer state,
and these can be read with the standard DOM API method `getAttribute()`;
likewise, the `setAttribute()` method will update the `view()` and UI state.

```javascript
// Gets  `elem`'s pivot state
var pivots = elem.getAttribute("row-pivots");

// Set `elems`'s sort state
elem.setAttribute("sort", JSON.stringify([["Sales", "desc"]]));
```

Alternatively, the `save()` and `restore()` methods allow you to read and write,
respectively, all `view()` configuration properties at once.

```javascript
// Get the current elem config
var state = elem.save();

// ... later

// Restore the previously saved state
elem.restore(state);
```

### Update events

Whenever a `<perspective-viewer>`s underlying `table()` is changed via the
`load()` or `update()` methods, a `perspective-view-update` DOM event is fired.
Similarly, `view()` updates instigated either through the Attribute API or
through user interaction will fire a `perspective-config-update` event:

```javascript
elem.addEventListener("perspective-config-update", function(event) {
    var config = elem.save();
    console.log("The view() config has changed to " + JSON.stringify(config));
});
```

Once an update has finished, a `perspective-update-complete` DOM event is fired.

```javascript
elem.addEventListener("perspective-update-complete", function(event) {
    console.log("Update is now complete");
});
```

### Click events

Whenever a `<perspective-viewer>`'s grid or chart are clicked, a
`perspective-click` DOM event is fired containing a detail object with `config`,
`column_names` and `row`.

The `config` object contains an array of `filters` that can be applied to a
`<perspective-viewer>` through the use of `restore()` updating it to show the
filtered subset of data.

The `column_names` property contains an array of matching columns and the `row`
property returns the associated row data.

```javascript
elem.addEventListener("perspective-click", function(event) {
    var config = event.detail.config;
    elem.restore(config);
});
```
