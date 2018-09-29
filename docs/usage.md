# Perspective User Guide <!-- omit in toc -->

- [Overview](#overview)
- [Perspective library](#perspective-library)
    - [In the browser](#in-the-browser)
    - [In Node.js](#in-nodejs)
    - [Loading data with `table()`](#loading-data-with-table)
        - [`index` and `limit`](#index-and-limit)
        - [Partial row updates via `undefined`](#partial-row-updates-via-undefined)
        - [Missing cells via `null`](#missing-cells-via-null)
        - [`remove()`](#remove)
    - [Querying data with `view()`](#querying-data-with-view)
    - [Deleting a `table()` or `view()`](#deleting-a-table-or-view)
- [`<perspective-viewer>` web component](#perspective-viewer-web-component)
    - [Loading data](#loading-data)
    - [Sharing a `table()` between multiple `<perspective-viewer>`s](#sharing-a-table-between-multiple-perspective-viewers)
    - [Remote Perspective via `WorkerHost()`](#remote-perspective-via-workerhost)
    - [Setting & reading viewer configuration via Attributes](#setting--reading-viewer-configuration-via-attributes)
    - [Update events](#update-events)

## Overview


Perspective is designed for modularity, allowing developers to pick and choose
which parts they need for their specific use case.  The main modules are:

- `@jpmorganchase/perspective`   
  The data engine library, as both a browser ES6 and Node.js module.  Provides an
  asm.js, WebAssembly, WebWorker (browser) and Process (node.js)
  runtime.

- `@jpmorganchase/perspective-viewer`  
  A user-configurable visualization widget, bundled as a [Web Component](https://www.webcomponents.org/introduction).  This module includes the core data
  engine module as a dependency.

In order to allow `<perspective-viewer>` to interop with industry standard Javascript
visualization libraries which may have mixed OSS/Commercial licenses such as 
[HighCharts](https://github.com/highcharts/highcharts), plugin modules are 
packages as separately and can be independently imported in a Perspective
project:

- `@jpmorganchase/perspective-viewer-hypergrid`  
  A `<perspective-viewer>` plugin for [Hypergrid](https://github.com/fin-hypergrid/core).

- `@jpmorganchase/perspective-viewer-highcharts`  
  A `<perspective-viewer>` plugin for [HighCharts](https://github.com/highcharts/highcharts).

Depending on your project, you may need just one, or all Perspective modules.  Some 
common use cases include:

* If you are only interested in the high-performance streaming data engine
(the WebAssembly part), or your project is purely Node.js based, you need only
the `@jpmorganchase/perspective` module, detailed [here](#perspective-library).

* If you are only interested in using Perspective as a simple, browser-based 
data visualization widget, you probably only need the
`@jpmorganchase/perspective-viewer` module and optionally its plugins
`@jpmorganchase/perspective-viewer-hypergrid` and 
`@jpmorganchase/perspective-viewer-highcharts`.  The core data engine
`@jpmorganchase/perspective` is a depedency of these packages and does not 
need to be imported on its own for basic usage.  Details for these can be found [here](#perspective-viewer-web-component).

* For more complex cases, such as [sharing tables between viewers](#sharing-a-table-between-multiple-perspective-viewers) and [binding a viewer to a remote view in node.js](#remote-perspective-via-workerhost), you will likely need all Perspective modules.

## Perspective library

[API Docs](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective)

As a library, `perspective` provides a suite of streaming pivot, aggregate, filter
and sort operations for tabular data. The engine can be instantiated in process,
or in a Web Worker (browser only);  in both cases, `perspective` exports a 
nearly identical API.

### In the browser

The `main` entry point for `@jpmorganchase/perspective` runs in a Web
Worker, such that the CPU workload is segregated from the web application in
which it is embedded, and so the bulk of engine code can be lazy-loaded only
after browser feature detection determines whether WebAssembly is supported.

The library can be imported ia ES6 module and/or Babel:

```javascript
import perspective from "@jpmorganchase/perspective";
```

or

```javascript
const perspective = require("@jpmorganchase/perspective");
```

Perspective can also be referenced via the global `perspective` module name in vanilla
Javascript, when e.g. importing `@jpmorganchase/perspective`
[via a CDN](https://unpkg.com/@jpmorganchase/perspective/build/perspective.js).

Once imported, you'll need to instance a `perspective` engine via the `worker()`
method. This will create a new WebWorker (browser) or Process (node.js), and
load the appropriate supported WebAssembly or asm.js binary; all calculation
and data accumulation will occur in this separate process.

```javascript
const worker = perspective.worker();
```

The `worker` symbol will expose the full `perspective` API for one managed
Web Worker process. You are free to create as many as your browser supports,
but be sure to keep track of the `worker` instances themselves, as you'll
need them to interact with your data in each instance.

### In Node.js

The `Node.js` runtime for the `@jpmorganchase/perpsective` module runs
in-process by defualt, and does not implement a `child_process` interface.
Hence, there is no `worker()` method, and the module object itself directly
exports the full `perspective` API.

```javascript
const perspective = require("@jpmorganchase/perspective/build/perspective.node.js");
```

### Loading data with `table()`

The basic data primitive of `perspective` is the `table`, which you can
instantiate via the `table()` method on a `worker`. Further data can be
supplied to the table via its `update()` method.

```javascript
// With data (also works with strings in CSV format)
var data = [
    { x: 1, y: "a", z: true },
    { x: 2, y: "b", z: false },
    { x: 3, y: "c", z: true },
    { x: 4, y: "d", z: false }
];

const table1 = worker.table(data);

// With a schema
var schema = {
    x: "integer",
    y: "string",
    z: "boolean"
};

const table2 = worker.table(schema);

// Add a new row to each table
table1.update([{ x: 5, y: "e", z: true }]);
table2.update([{ x: 5, y: "e", z: true }]);
```

#### `index` and `limit`

The `table()` method also takes an options object, with which you can provide
the name of an `index` column in the underlying dataset, which will act as a
primary key on the `table`, replacing `update`d rows instead of appending them.

```javascript
// Use the 'x' column as a primary key
const table3 = worker.table(data, { index: "x" });
```

Mutually exclusive to `index`, you may limit the total number of rows in a
`table()` via the `limit` property, which preserves only the most recently
added rows.

```javascript
// Keep only the most recent 1000 rows
const table3 = worker.table(data, { limit: 1000 });
```

#### Partial row updates via `undefined`

TODO

#### Missing cells via `null`

TODO

#### `remove()`

TODO

### Querying data with `view()`

In order to query the table, you must then create a `view()`, an immutable set
of transformations for an associated `table()`. A `view()` is created from a
`table()` via a configuration object, and a `view()` instance can return data
from queries to its various methods (see the
[API](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective)).

```javascript
const table = worker.table(data);

const view = table.view({
    aggregate: [{ column: "Sales", op: "sum" }],
    row_pivot: ["Region", "Country"],
    filter: [["Category", "in", ["Furniture", "Technology"]]]
});

view.to_json().then(json => console.log(json));
```

A `table()` can have as many `view()` associated with it as you need!
Perspective will conserve memory and updates by relying on a single instance of
a `table()` to power multiple `view()`s concurrently.

### Deleting a `table()` or `view()`

Unlike standard Javascript objects, Perspective objects such as `table()` and
`view()` store their associated data in the WebAssembly heap.  Due of this,
and the current lack of a hook into the Javascript runtime's garbage collector
from WebAssembly, the memory allocated to these Perspective objects does not
automatically get cleaned up when the object falls out of scope.  In order to
prevent memory leaks and reclaim the memory associated with a Perspective
`table()` or `view()`, you must call the `delete()` method.

```javascript
view.delete();

// This method will throw an exception if there are still `view()`s depending
// on this `table()`!
table.delete();
```

## `<perspective-viewer>` web component


[API Docs](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective-viewer)

As a component, `perspective-viewer` provides a complete graphical UI for
configuring the `perspective` library and formatting its output to the
provided visualization plugins.

<img src="./architecture.svg">

If you are using babel or another build environment which supports ES6 modules,
you need only import the `perspective-viewer` libraries somewhere in your
application - these modules export nothing, but rather register the components
for use within your site's regular HTML:

```javascript
import "@jpmorganchase/perspective-viewer";
import "@jpmorganchase/perspective-viewer-hypergrid";
import "@jpmorganchase/perspective-viewer-highcharts";
```

You must also import a theme when bundling perspective-viewer. Even though there
are only 2 of them.

```javascript
import "@jpmorganchase/perspective-viewer/build/material.css"; // or default.css
```

Alternatively, if you're fine with a default theme and don't want to bundle yourself,
you can just import the pre-bundled assets from their respective modules.

```html
<script src="perspective.view.js"></script>
<script src="hypergrid.plugin.js"></script>
<script src="highcharts.plugin.js"></script>
```

Once imported, the `<perspective-viewer>` Web Component will be available in
any standard HTML on your site. A simple example:

```html
<perspective-viewer id="view1"></perspective-viewer>
```

### Loading data

To load data into a `<perspective-viewer>`, you can call the `load()` method
from Javascript on simple JSON or CSV data, like so:

```javascript
document.addEventListener("WebComponentsReady", function() {
    var data = [
        { x: 1, y: "a", z: true },
        { x: 2, y: "b", z: false },
        { x: 3, y: "c", z: true },
        { x: 4, y: "d", z: false }
    ];

    var viewer = document.getElementById("view1");
    viewer.load(data);

    // Add new row
    viewer.update([{ x: 5, y: "e", z: true }]);
});
```

In some situations, you may want finer grained control over the `table()`
construction (see below), and `<perspective-viewer>`'s `load()` method
also supports loading `table()`s directly. Remember to import the `perspective.js`
library also, or the `perspective` symbol will not be available - though you
can always use the `worker` property on a `<perspective-viewer>` to get the
default worker singleton instantiated when another is not provided.

```javascript
// Create a new worker, then a new table on that worker.
var table = perspective.worker().table(data);

// Bind a viewer element to this table.
viewer.load(table);
```

### Sharing a `table()` between multiple `<perspective-viewer>`s

Views can share a table by instancing it separately and passing it to the
`load()` method. Both Views will update when the underlying `table`'
s `update()` method is invoked, but `table.delete()` will fail
until all Views which use it are also deleted.

```javascript
var view1 = document.getElementById("view1");
var view2 = document.getElementById("view2");

// Use the default Web Worker instance
var tbl = view1.worker.table(data);

view1.load(tbl);
view2.load(tbl);

tbl.update([{ x: 5, y: "e", z: true }]);
```

### Remote Perspective via `WorkerHost()`

For exceptionally large datasets, a `<perspective-viewer>` can be bound to a
`perspective.table()` instance running in node.js remotely, rather than
creating one in a Web Worker and downloading the entire data set. This
trades off network bandwidth and server resource requirements, for a smaller
browser memory and CPU footprint.

In Node:

```javascript
const {
    WebSocketHost
} = require("@jpmorganchase/perspective/build/perspective.node.js");
const fs = require("fs");

// Start a WS/HTTP host on port 8080.
const host = new WebSocketHost({ assets: [__dirname], port: 8080 });

// Read an arrow file from the file system and load it as a named data source.
const arr = fs.readFileSync(__dirname + "/superstore.arrow");
host.open("data_source_one", arr);
```

TODO examples

In the browser:

```javascript
var elem = document.getElementsByTagName("perspective-viewer")[0];

// Bind to the server's worker instead of instantiating a Web Worker.
var worker = perspective.worker(window.location.origin.replace("http", "ws"));

// Bind the viewer to the preloaded data source.
elem.load(worker.open("data_source_one"));
```

`<perspective-viewer>` instnaces bound in this way are otherwise no different
than `<perspective-viewer>`s which rely on a Web Worker, and can even share a
host application with Web Worker bound `table()`s.

### Setting & reading viewer configuration via Attributes

`<perspective-view>` uses the DOM's regular attribute API to set it's
initial state, by reading JSON encoded properties from attributes for each
`perspective` configuration property. For example, this HTML will apply
`row_pivot` and `filter` confiuration to the initial `view()` created when
data is loaded via the `load()` method, as well as set the UI controls to
reflect this config:

```html
<perspective-viewer
    row-pivots='["Category","Sub-Category"]'
    filters='[["State","==","Texas"]]'>

</perspective-viewer>
```

Attributes on a `<perspective-viewer>` are reactive. When the user interacts
with the viewer, the attribtues will update to reflect the current viewer
state, and these can be read with the standard DOM API method `getAttribute()`;
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

TODO

See
[Attribute API Docs](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective-viewer)
for a full description of the available Attributes.
