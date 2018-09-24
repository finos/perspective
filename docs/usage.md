---
id: usage
title: Usage
---

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
Javascript, when e.g. importing `@jpmorganchase/perspective` [via a CDN](https://unpkg.com/@jpmorganchase/perspective-examples@0.2.0-beta.2/build/perspective.js).

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

See [perspective-examples/node_server.js](https://github.com/jpmorganchase/perspective/blob/master/packages/perspective-examples/src/js/node_server.js)
for an example.

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

The `table()` method also takes an options object, with which you can provide
the name of an `index` column in the underlying dataset, which will act as a
primary key on the `table`, replacing `update`d rows instead of appending them.

```javascript
// Use the 'x' column as a primary key
const table3 = worker.table(data, {index: 'x'});
```

### `view()`

In order to query the table, you must then create a `view()`, an immutable set
of transformations for an associated `table()`.  A `view()` is created from a
`table()` via a configuration object, and a `view()` instance can return data
from queries to its various methods (see the [API](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective)).

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
you can just import the pre-bundled assets from the `perspective-examples` 
module's `build/` directory:

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

To load data into a `<perspective-viewer>`, you can call the `load()` method 
from Javascript like so:

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


