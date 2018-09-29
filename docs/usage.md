---
id: usage
title: Usage
---

# Overview

<img src="./architecture.svg">

## Perspective library

[API Docs](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective)

As a library, `perspective` provides a suite of streaming pivot, aggregate, filter
and sort operations for tabular data.  The engine can be instantiated in process,
or in a Web Worker (browser only), and is published in the `@jpmorganchase/perspective`
NPM module.

### In the browser

The `main` entry point for the `@jpmorganchase/perspective` runs in a Web 
Worker, such that the CPU workload is segregated from the web application in
which it is embedded, and so the bulk of engine code can be lazy-loaded only 
after browser feature detection determines whether WebAssembly is supported.

The library can be imported ia ES6 module and/or Babel:

```javascript
import perspective from 'perspective';
```

or

```javascript
const perspective = require('perspective');
```

Perspective can also be referenced via the global `perspective` module name in vanilla
Javascript, when e.g. importing `@jpmorganchase/perspective` 
[via a CDN](https://unpkg.com/@jpmorganchase/perspective/build/perspective.js).

Once imported, you'll need to instance a `perspective` engine via the `worker()` 
method.  This will create a new WebWorker (browser) or Process (node.js), and 
load the appropriate supported WebAssembly or asm.js binary; all calculation
and data accumulation will occur in this separate process.

```javascript
const worker = perspective.worker();
```

The `worker` symbol will expose the full `perspective` API for one managed
Web Worker process.  You are free to create as many as your browser supports,
but be sure to keep track of the `worker` instances themselves, as you'll
need them to interact with your data in each instance.

### In Node.js

The `Node.js` runtime for the `@jpmorganchase/perpsective` module runs
in-process by defualt, and does not implement a `child_process` interface.
Hence, there is no `worker()` method, and the module object itself directly
exports the full `perspective` API.

```javascript
const perspective = require('@jpmorganchase/perspective/build/perspective.node.js');
```

### `table()`

The basic data primitive of `perspective` is the `table`, which you can
instantiate via the `table()` method on a `worker`.  Further data can be
supplied to the table via its `update()` method.

```javascript
// With data (also works with strings in CSV format)
var data = [   
    {'x': 1, 'y':'a', 'z': true},
    {'x': 2, 'y':'b', 'z': false},
    {'x': 3, 'y':'c', 'z': true},
    {'x': 4, 'y':'d', 'z': false}
];

const table1 = worker.table(data);

// With a schema
var schema = {
    x: 'integer',
    y: 'string',
    z: 'boolean'
};

const table2 = worker.table(schema);

// Add a new row to each table
table1.update([{x: 5, y: 'e', z: true}]);
table2.update([{x: 5, y: 'e', z: true}]);
```

#### `index` and `limit`

The `table()` method also takes an options object, with which you can provide
the name of an `index` column in the underlying dataset, which will act as a
primary key on the `table`, replacing `update`d rows instead of appending them.

```javascript
// Use the 'x' column as a primary key
const table3 = worker.table(data, {index: 'x'});
```

Mutually exclusive to `index`, you may limit the total number of rows in a
`table()` via the `limit` property, which preserves only the most recently
added rows.

```javascript
// Keep only the most recent 1000 rows
const table3 = worker.table(data, {limit: 1000});
```

#### Partial row updates via `undefined`

TODO

#### Missing cells via `null`

TODO

#### `remove()`

TODO

### `view()`

In order to query the table, you must then create a `view()`, an immutable set
of transformations for an associated `table()`.  A `view()` is created from a
`table()` via a configuration object, and a `view()` instance can return data
from queries to its various methods (see the 
[API](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective)).

```javascript
const table = worker.table(data);

const view = table.view({
    aggregate: [{column: "Sales", op: "sum"}],
    row_pivot: ["Region", "Country"],
    filter: [["Category", "in", ["Furniture", "Technology"]]]
});

view.to_json().then(json => console.log(json));
```

## <perspective-viewer> web component

[API Docs](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective-viewer)

As a component, `perspective-viewer` provides a complete graphical UI for
configuring the `perspective` library and formatting its output to the
provided visualization plugins.

If you are using babel or another build environment which supports ES6 modules,
you need only import the `perspective-viewer` libraries somewhere in your
application - these modules export nothing, but rather register the components
for use within your site's regular HTML:

```javascript
import "@jpmorganchase/perspective-viewer";
import "@jpmorganchase/perspective-viewer-hypergrid";
import "@jpmorganchase/perspective-viewer-highcharts";
```

You must also import a theme when bundling perspective-viewer.  Even though there
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
any standard HTML on your site.  A simple example:

```html
<perspective-viewer id="view1"></perspective-viewer>
```

### Loading data

To load data into a `<perspective-viewer>`, you can call the `load()` method 
from Javascript on simple JSON or CSV data, like so:

```javascript
document.addEventListener("WebComponentsReady", function () {

    var data = [   
        {'x': 1, 'y':'a', 'z': true},
        {'x': 2, 'y':'b', 'z': false},
        {'x': 3, 'y':'c', 'z': true},
        {'x': 4, 'y':'d', 'z': false}
    ];

    var viewer = document.getElementById('view1');
    viewer.load(data);

    // Add new row
    viewer.update([{'x': 5, 'y': 'e', 'z': true}]);

});
```

In some situations, you may want finer grained control over the `table()` 
construction (see below), and `<perspective-viewer>`'s `load()` method
also supports loading `table()`s directly.  Remember to import the `perspective.js`
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
`load()` method.  Both Views will update when the underlying `table`'
s `update()` method is invoked, but `table.delete()` will fail
until all Views which use it are also deleted.

```javascript
var view1 = document.getElementById('view1');
var view2 = document.getElementById('view2');

// Use the default Web Worker instance
var tbl = view1.worker.table(data);

view1.load(tbl);
view2.load(tbl);

tbl.update([{'x': 5, 'y': 'e', 'z': true}]);
```

### Remote Perspective via `WorkerHost()`

For exceptionally large datasets, a `<perspective-viewer>` can be bound to a 
`perspective.table()` instance running in node.js remotely, rather than 
creating one in a Web Worker and downloading the entire data set.  This 
trades off network bandwidth and server resource requirements, for a smaller
browser memory and CPU footprint.

In Node:

```javascript
const {WebSocketHost} = require("@jpmorganchase/perspective/build/perspective.node.js");
const fs = require("fs");

// Start a WS/HTTP host on port 8080.
const host = new WebSocketHost({assets: [__dirname], port: 8080});

// Read an arrow file from the file system and load it as a named data source.
const arr = fs.readFileSync(__dirname + "/superstore.arrow");
host.open("data_source_one", arr);
```

TODO examples

In the browser:

```javascript
var elem = document.getElementsByTagName('perspective-viewer')[0];

// Bind to the server's worker instead of instantiating a Web Worker.
var worker = perspective.worker(window.location.origin.replace('http', 'ws'));

// Bind the viewer to the preloaded data source.
elem.load(worker.open('data_source_one'));
```

`<perspective-viewer>` instnaces bound in this way are otherwise no different
than `<perspective-viewer>`s which rely on a Web Worker, and can even share a
host application with Web Worker bound `table()`s.


### Setting & reading viewer configuration via Attributes

`<perspective-view>` uses the DOM's regular attribute API to set it's 
initial state, by reading JSON encoded properties from attributes for each
`perspective` configuration property.  For example, this HTML will apply
`row_pivot` and `filter` confiuration to the initial `view()` created when
data is loaded via the `load()` method, as well as set the UI controls to
reflect this config:

```html
<perspective-viewer 
    row-pivots='["Category","Sub-Category"]'
    filters='[["State","==","Texas"]]'>

</perspective-viewer>
```

Attributes on a `<perspective-viewer>` are reactive.  When the user interacts
with the viewer, the attribtues will update to reflect the current viewer 
state, and these can be read with the standard DOM API method `getAttribute()`;
likewise, the `setAttribute()` method will update the `view()` and UI state.

```javascript
// Gets  `elem`'s pivot state
var pivots = elem.getAttribute('row-pivots');

// Set `elems`'s sort state
elem.setAttribute('sort', JSON.stringify([["Sales", "desc"]]));
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



