---
id: js
title: JavaScript User Guide
---

Perspective's JavaScript library offers a flexible, intuitive UI on top of a
fast, powerful streaming data engine. Developers are able to pick and
choose the modules they require for their use case, and users are presented
with a clean user interface through which to analyze data.

[More Examples](https://github.com/finos/perspective/tree/master/examples)
are available on GitHub.

## Installation

Because Perspective uses both WebAssembly and Web Workers, each of which place
constraints on how assets and scripts must be loaded, the installation process
for Perspective in a Javascript environment is more complex than most "pure"
Javascript libraries.

### From NPM

For using Perspective from Node.js, or as a dependency in a `package.json` based
`webpack` or other browser application build toolchain, Perspective is available
via NPM:

```bash
$ yarn add @finos/perspective-viewer @finos/perspective-viewer-d3fc @finos/perspective-viewer-datagrid
```

Perspective requires the browser to have access to
Perspective's `.worker.js` and `.wasm` assets _in addition_ to the bundled
`.js` scripts. By default, Perspective <a href="https://github.com/finos/perspective/pull/870">inlines</a>
these assets into the `.js` scripts, and delivers them in one file. This has no
runtime performance impact, but does increase asset load time. Most apps
should make use of `@finos/perspective-webpack-plugin` which will package
these files correctly form your existing Webpack configuration.

### Webpack Plugin

When importing `perspective` from NPM modules for a browser application, you
should use `@finos/perspective-webpack-plugin` to manage the `.worker.js` and
`.wasm` assets for you. The plugin handles downloading and packaging
Perspective's additional assets, and is easy to set up in your `webpack.config`:

```javascript
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

module.exports = {
    entry: "./in.js",
    output: {
        filename: "out.js",
        path: "build"
    },
    plugins: [new PerspectivePlugin()]
};
```

Otherwise, you'll need to configure your `webpack.config.js` to handle these
`perspective` assets correctly.  ~`@finos/perspective-webpack-plugin` itself
uses a combination of `worker-loader` and `file-loader`, which can be easily
modified as needed:

```javascript
module.exports = {
    rules: [
        {
            test: /perspective\.worker\.js$/,
            type: "javascript/auto",
            include: path.dirname(require.resolve("@finos/perspective")),
            loader: "worker-loader"
        },
        {
            test: /perspective\.cpp\.wasm$/,
            type: "javascript/auto",
            include: path.dirname(require.resolve("@finos/perspective")),
            loader: "file-loader"
        }
    ]
};
```

### From CDN

Perspective can be loaded directly from
[unpkg.com](https://unpkg.com/@finos/perspective-viewer), which is the easiest
way to get started with Perspective in the browser, and absolutely perfect
for spinning up quick instances of `perspective-viewer`. An example is
demonstrated in [`superstore-arrow.html`](https://github.com/finos/perspective/blob/master/examples/simple/superstore-arrow.html),
which loads a dataset stored in the Apache Arrow format using the `Fetch` API.

Add these scripts to your `.html`'s `<head>` section:

```html
<script src="https://unpkg.com/@finos/perspective"></script>
<script src="https://unpkg.com/@finos/perspective-viewer"></script>
<script src="https://unpkg.com/@finos/perspective-viewer-datagrid"></script>
<script src="https://unpkg.com/@finos/perspective-viewer-d3fc"></script>
```

Once added to your page, you can access the Javascript API through the
`perspective` symbol:

```javascript
const worker = perspective.worker();
const table = worker.table({A: [1, 2, 3]});
const view = table.view({sort: [["A", "desc"]]});
```

Or create a `<perspective-viewer>` in HTML:

```html
<perspective-viewer columns="['Sales', 'Profit']">`
  <script>
    document.addEventListener("WebComponentsReady", function() {
      const data = {
        Sales: [500, 1000, 1500],
        Profit: [100.25, 200.5, 300.75]
      };
      // The `<perspective-viewer>` HTML element exposes the viewer API
      const el = document.getElementsByTagName("perspective-viewer")[0];
      el.load(data);
    });
  </script>
</perspective-viewer>
```

This makes it easy to spin up Perspective locally without depending
on a build chain or other tooling. For production usage, you should incorporate
Perspective into your application's bundled scripts using `NPM` and `Webpack`.


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
JavaScript libraries, such as [d3fc](https://d3fc.io/), are packaged separately
and must be imported individually.

Perspective offers these plugin modules:

- `@finos/perspective-viewer-datagrid`  
  A custom high-performance data-grid component based on HTML `<table>`.

- `@finos/perspective-viewer-d3fc`  
  A `<perspective-viewer>` plugin for the [d3fc](https://d3fc.io) charting
  library.

When imported after `@finos/perspective-viewer`, the plugin modules will
register themselves automatically, and the renderers they export will be
available in the `view` dropdown in the `<perspective-viewer>` UI.

Developers can choose to opt into the features, bundle size inflation, and
licensing for these dependencies as needed.

### Which modules should I import?

Depending on your requirements, you may need just one, or all, Perspective
modules. Here are some basic guidelines to help you decide what is most appropriate
for your project:

- For Perspective's high-performance streaming data engine (in WebAssembly), or
  for a purely Node.js based application, import:

  - `@finos/perspective`, as detailed [here](#perspective-library)

- For Perspective as a simple, browser-based data visualization widget, you
  will need to import:

  - `@finos/perspective`, detailed [here](#perspective-library)
  - `@finos/perspective-viewer`, detailed [here](#perspective-viewer-web-component)
  - `@finos/perspective-viewer-datagrid` for data grids
  - `@finos/perspective-viewer-d3fc` for charting

- For more complex cases, such as
  [sharing tables between viewers](#sharing-a-table-between-multiple-perspective-viewers)
  and
  [binding a viewer to a remote view in Node.js](#remote-perspective-via-workerhost), you will likely need all Perspective modules.

## `perspective` library

As a library, `perspective` provides a suite of streaming pivot, aggregate,
filter and sort operations for tabular data. The engine can be instantiated in
process or in a Web Worker (browser only); in both cases, `perspective` exports
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

`@finos/perspective` also exports process management functions, such as
`worker()` and `websocket()` (in the browser) and `WebSocketServer()`
(in Node.js). See the [API documentation](/obj/perspective.html) for a complete
reference on all exported methods.  This module is a dependency of 
`@finos/perspective-viewer`, and is not needed if you only intend to use
`<perspective-viewer>` to visualize simple data.

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
`perspective` module name in vanilla JavaScript, when e.g. importing
[via a CDN](#from-cdn).

```html
<script src="perspective.js"></script>
```

#### Instantiating a new `worker()`

Once imported, you'll need to instantiate a `perspective` engine via the
`worker()` method. This will create a new Web Worker (browser) or
Process (Node.js) and load the WebAssembly binary; all calculation and data
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
default and does not implement a `child_process` interface. Hence, there is no
`worker()` method, and the module object itself directly exports the full
`perspective` API.

```javascript
const perspective = require("@finos/perspective");
```

### Serializing data using `to_*()`

The `view()` allows for serialization of data to the user through the
`to_json()`, `to_columns()`, `to_csv()`, and `to_arrow()` methods. These
methods return a `promise` for the calculated data:

Via `Promise`

```javascript
view.to_json().then(json => console.log(json));
view.to_columns().then(json => console.log(json));
view.to_csv().then(csv => console.log(csv));
view.to_arrow().then(arrow => console.log(arrow));
```

Via ES6 `await`/`async`

```javascript
async function print_data() {
    console.log(await view.to_json());
    console.log(await view.to_columns());
    console.log(await view.to_csv());
    console.log(await view.to_arrow());
}
```

### Deleting a `table()` or `view()`

Unlike standard JavaScript objects, Perspective objects such as `table()` and
`view()` store their associated data in the WebAssembly heap. Because of this, as
well as the current lack of a hook into the JavaScript runtime's garbage collector from
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

### Customizing behavior with `perspective.config.js`

For ease of configuration synchronization between the Node.js, WebWorker and
Browser, Perspective supports configuration statically.

You may override Perspective's [default settings](https://github.com/finos/perspective/blob/master/packages/perspective/src/js/config/settings.js)
via a `perspective.config.js` or `perspective.config.json` file in your
project's root or parent path, or via the `"perspective"` key in your project's
`package.json`.

Note that, while in Node.js, this config file is read at runtime; for the browser,
this file must be read at compile time (handled automatically via
[`@finos/perspective-webpack-plugin`](https://github.com/finos/perspective/tree/master/packages/perspective-webpack-plugin)).

Thus, to update it, you must either rebuild your code, or supply the JSON
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

If you are using Babel or another build environment which supports ES6 modules,
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
A number of themes come bundled with `perspective-viewer`; you can import
any of these themes directly into your app, and the `perspective-viewer`s
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

These can be directly linked in your HTML file:

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@finos/perspective-viewer/dist/umd/material.css"
/>
```

### Loading data into `<perspective-viewer>`

Data can be loaded into `<perspective-viewer>` in the form of a `Table()` via
the `load()` method.

```javascript
// Create a new worker, then a new table on that worker.
const table = perspective.worker().table(data);

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

### Server-only via `WebSocketServer()` and Node.js

For exceptionally large datasets, a `<perspective-viewer>` can be bound to a
`perspective.table()` instance running in Node.js remotely, rather than creating
one in a Web Worker and downloading the entire data set. This trades off network
bandwidth and server resource requirements for a smaller browser memory and CPU
footprint.

In Node.js:

```javascript
const {WebSocketServer, table} = require("@finos/perspective");
const fs = require("fs");

// Start a WS/HTTP host on port 8080.  The `assets` property allows
// the `WebSocketServer()` to also serves the file structure rooted in this
// module's directory.
const host = new WebSocketServer({assets: [__dirname], port: 8080});

// Read an arrow file from the file system and host it as a named table.
const arr = fs.readFileSync(__dirname + "/superstore.arrow");
const tbl = table(arr);
host.host_table("table_one", tbl);
```

In the browser:

```javascript
const elem = document.getElementsByTagName("perspective-viewer")[0];

// Bind to the server's worker instead of instantiating a Web Worker.
const websocket = perspective.websocket(window.location.origin.replace("http", "ws"));

// Bind the viewer to the preloaded data source.  `table` and `view` objects
// live on the server.
const server_table = websocket.open_table("table_one");
elem.load(server_table);

// Or load data from a table using a view. The browser now also has a copy of
// this view in its own `table`, as well as its updates transferred to the
// browser using Apache Arrow.
const worker = perspective.worker();
const server_view = server_table.view();
const client_table = worker.table(server_view);
elem.load(client_table);
```

`<perspective-viewer>` instances bound in this way are otherwise no different
than `<perspective-viewer>`s which rely on a Web Worker, and can even share a
host application with Web Worker-bound `table()`s. The same `promise`-based API
is used to communicate with the server-instantiated `view()`, only in this case
it is over a websocket.

### Server-only via `perspective-python` and Tornado

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
    # create a websocket endpoint that the client JavaScript can access
    (r"/websocket", PerspectiveTornadoHandler, {"manager": MANAGER, "check_origin": True})
])

# Start the Tornado server
app.listen(8888)
loop = tornado.ioloop.IOLoop.current()
loop.start()
```

The JavaScript implementation of this does not require Webpack or any bundler,
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

        All operations that are possible through the JavaScript API are possible
        on the Python API as well, thus calling `view()`, `schema()`, `update()`
        etc. on `const table` will pass those operations to the Python `Table`,
        execute the commands, and return the result back to JavaScript.*/
    const table = websocket.open_table("data_source_one");

    // Load this in the `<perspective-viewer>`.
    document.getElementById("viewer").load(table);
  });
</script>
```

Any operation performed on the `<perspective-viewer>` instance or on
`const table` will be forwarded to Python, which will execute the operation and
return the results back to JavaScript.

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

Whenever a `<perspective-viewer>`'s grid or chart is clicked, a
`perspective-click` DOM event is fired containing a detail object with `config`,
`column_names`, and `row`.

The `config` object contains an array of `filters` that can be applied to a
`<perspective-viewer>` through the use of `restore()` updating it to show the
filtered subset of data.

The `column_names` property contains an array of matching columns, and the `row`
property returns the associated row data.

```javascript
elem.addEventListener("perspective-click", function(event) {
    var config = event.detail.config;
    elem.restore(config);
});
```
