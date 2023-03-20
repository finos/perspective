---
id: js
title: JavaScript User Guide
---

Perspective's JavaScript library offers a configurable UI powered by a fast
streaming data engine. Developers are able to pick and choose the modules they
require for their use case, and users are presented with a clean user interface
through which to analyze data.

[More Examples](https://github.com/finos/perspective/tree/master/examples) are
available on GitHub.

## Installation

Perspective releases contain several different builds for easy usage in most
environments, either via NPM with or without a bundler, or via `<script>` tag
from a CDN or asset server of your choice. Depending on which build you choose,
due to the presence of both WebAssembly and WebWorkers, the installation process
for Perspective may be somewhat more complex than most "pure" Javascript
libraries if you want to achieve optimal initial load-time performance.

### From NPM (Node.js)

To use Perspective from a Node.js server, simply install via NPM.

```bash
$ yarn add @finos/perspective
```

### From NPM (Browser)

For using Perspective as a dependency in a `webpack` (or other bundler) app,
Perspective's WebAssembly data engine is available via NPM in the same package,
`@finos/perspective`. For the `@finos/perspective-viewer` UI, a few additional
packages are required:

```bash
$ yarn add @finos/perspective @finos/perspective-viewer @finos/perspective-viewer-d3fc @finos/perspective-viewer-datagrid
```

Perspective requires the browser to have access to Perspective's `.worker.js`
and `.wasm` assets _in addition_ to the bundled `.js` scripts. By default,
Perspective <a href="https://github.com/finos/perspective/pull/870">inlines</a>
these assets into the `.js` scripts, and delivers them in one file. This has no
runtime performance impact, but does increase asset load time. Most apps should
make use of `@finos/perspective-webpack-plugin` which will package these files
correctly form your existing Webpack configuration.

#### Via bundlers (optional)

When importing `perspective` from NPM modules for a browser application, you may
choose to use a provided bundler plugin to manage the `.worker.js` and `.wasm`
assets for you. Doing so will improve your application's initial load
performance, as the plugin-assisted bundle version of Perspective:

-   Downloads `.wasm` and `.js` assets in parallel.
-   Compiles `.wasm` incrementally via
    [streaming instantiation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiateStreaming).
-   overall bundle size is ~20% smaller (due to bas64 encoding overhead).

Perspective comes with bundler plugins for:

-   Webpack via `@finos/perspective-webpack-plugin`
-   `esbuild` via `@finos/perspective-esbuild-plugin`

##### Webpack

The plugin handles downloading and packaging Perspective's additional assets,
and is easy to set up in your `webpack.config`:

```javascript
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

module.exports = {
    entry: "./in.js",
    output: {
        filename: "out.js",
        path: "build",
    },
    plugins: [new PerspectivePlugin()],
};
```

##### `esbuild`

Applications bundled with `esbuild` can make use of the
`@finos/perspective-esbuild-plugin` module. A full example can be found in the
repo under
[`examples/esbuild-example`](https://github.com/finos/perspective/tree/master/examples/esbuild-example).

```javascript
const esbuild = require("esbuild");
const {
    PerspectiveEsbuildPlugin,
} = require("@finos/perspective-esbuild-plugin");

esbuild.build({
    entryPoints: ["src/index.js"],
    plugins: [PerspectiveEsbuildPlugin()],
    format: "esm",
    bundle: true,
    loader: {
        ".ttf": "file",
    },
});
```

When bundling via `esbuild`, you must also

-   Use the `type="module"` attribute in your app's `<script>` tag, as this
    build mode is only supported via ES modules.
-   Use the direct imports for the `esm` versions Perspective, specifically
    `@finos/perspective/dsti/esm/perspective.js` and
    `@finos/perspective-viewer/dist/esm/perspective-viewer.js`

### From CDN

Perspective can be loaded directly from most CDNs, such as
[jsdelivr.com](https://www.jsdelivr.com/package/npm/@finos/perspective-viewer),
which is the easiest way to get started with Perspective in the browser, and
perfect for spinning up quick instances of `perspective-viewer` without
installing or bundling. There are two supported builds you may use, a UMD build
and a `type="module"` ESM build.

While CDNs are great for development builds and small apps, for production usage
you should incorporate Perspective into your application with a bundler like
`Webpack`, described above.

#### UMD

This build is equivalent to the _inline_ build described above, and contains all
JavaScript, CSS, WebAssembly and WebWorker assets bundled in a single `.js`
file. To use the UMD build from a `jsdelivr.com`, add these scripts to your
`.html`'s `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/@finos/perspective"></script>
<script src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer"></script>
<script src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid"></script>
<script src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc"></script>

<link
    rel="stylesheet"
    crossorigin="anonymous"
    href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/pro.css"
/>
```

Once added to your page, you can access the engine's JavaScript API through the
`perspective` symbol and the browser's Custom Elements API:

```html
<script>
    const worker = window.perspective.worker();
    const table = await worker.table({ A: [1, 2, 3] });
    const view = await table.view({ sort: [["A", "desc"]] });

    const viewer = document.createElement("perspective-viewer");
    viewer.load(table);
    document.body.appendChild(viewer);
</script>
```

#### ESM

This build separates out Perspective's JavaScript, WebAssembly and various
assets into individual files, allowing the browser to load them lazily, in
parallel or not at all if needed. To use this build, you must include the
perspective asset files in a script tag with the `type="module"` attribute set.

```html
<script
    type="module"
    src="https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.js"
></script>
<script
    type="module"
    src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/cdn/perspective-viewer.js"
></script>
<script
    type="module"
    src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid/dist/cdn/perspective-viewer-datagrid.js"
></script>
<script
    type="module"
    src="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc/dist/cdn/perspective-viewer-d3fc.js"
></script>

<link
    rel="stylesheet"
    crossorigin="anonymous"
    href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/pro.css"
/>
```

When using the ESM build, there is no global `perspective` symbol, so you must
import the `@finos/perspective` module in a `type="module"` script as well:

```html
<script type="module">
    import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective/dist/cdn/perspective.js";

    const worker = perspective.worker();
    const table = agent.table({ x: [1, 2, 3, 4, 5] });
    document.querySelector("perspective-viewer").load(table);
</script>
```

## Module Structure

Perspective is designed for flexibility, allowing developers to pick and choose
which modules they need for their specific use case. The main modules are:

-   `@finos/perspective`  
    The data engine library, as both a browser ES6 and Node.js module. Provides
    a WebAssembly, WebWorker (browser) and Process (node.js) runtime.

-   `@finos/perspective-viewer`  
    A user-configurable visualization widget, bundled as a
    [Web Component](https://www.webcomponents.org/introduction). This module
    includes the core data engine module as a dependency.

`<perspective-viewer>` by itself only implements a trivial debug renderer, which
prints the currently configured `view()` as a CSV. Plugin modules for popular
JavaScript libraries, such as [d3fc](https://d3fc.io/), are packaged separately
and must be imported individually.

Perspective offers these plugin modules:

-   `@finos/perspective-viewer-datagrid`  
    A custom high-performance data-grid component based on HTML `<table>`.

-   `@finos/perspective-viewer-d3fc`  
    A `<perspective-viewer>` plugin for the [d3fc](https://d3fc.io) charting
    library.

When imported after `@finos/perspective-viewer`, the plugin modules will
register themselves automatically, and the renderers they export will be
available in the `plugin` dropdown in the `<perspective-viewer>` UI.

### Which modules should I import?

Depending on your requirements, you may need just one, or all, Perspective
modules. Here are some basic guidelines to help you decide what is most
appropriate for your project:

-   For Perspective's high-performance streaming data engine (in WebAssembly),
    or for a purely Node.js based application, import:

    -   `@finos/perspective`, as detailed [here](#perspective-library)

-   For Perspective as a simple, browser-based data visualization widget, you
    will need to import:

    -   `@finos/perspective`, detailed [here](#perspective-library)
    -   `@finos/perspective-viewer`, detailed
        [here](#perspective-viewer-web-component)
    -   `@finos/perspective-viewer-datagrid` for data grids
    -   `@finos/perspective-viewer-d3fc` for charting

-   For more complex cases, such as
    [sharing tables between viewers](#sharing-a-table-between-multiple-perspective-viewers)
    and
    [binding a viewer to a remote view in Node.js](#remote-perspective-via-workerhost),
    you will likely need all Perspective modules.

## `perspective` data engine library

As a library, `perspective` provides a suite of streaming pivot, aggregate,
filter and sort operations for tabular data. The engine can be instantiated in
process or in a Web Worker (browser only); in both cases, `perspective` exports
a nearly identical API.

It exports Perspective's data interfaces:

-   `table()`: an interface over a single dataset, used to input static and
    streaming data into Perspective.
    -   In the browser, `table()`s live in a Web Worker to isolate their runtime
        from the renderer.
-   `view()`: a continuous query of a `table()`, used to read data and calculate
    analytics from a `table()`.
    -   `view()`s also live in a Web Worker when used in a browser.
    -   A single `table()` may have many `view()`s attached at once.

`@finos/perspective` also exports process management functions, such as
`worker()` and `websocket()` (in the browser) and `WebSocketServer()` (in
Node.js). See the [API documentation](/obj/perspective.md) for a complete
reference on all exported methods. This module is a dependency of
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
[via a CDN](#from-cdn):

```html
<script src="@finos/perspective"></script>
```

... or as a module:

```html
<script type="module" src="@finos/perspective/dist/cdn/perspective.js"></script>
```

#### Instantiating a new `worker()`

Once imported, you'll need to instantiate a `perspective` engine via the
`worker()` method. This will create a new Web Worker (browser) or Process
(Node.js) and load the WebAssembly binary; all calculation and data accumulation
will occur in this separate process.

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

In Node.js, perspective does not run in a WebWorker (as this API does not exist
in Node.js), so no need to call the `.worker()` factory function - the
`perspective` library exports the functions directly and run synchronously in
the main process.

### Serializing data using `to_*()`

The `view()` allows for serialization of data to the user through the
`to_json()`, `to_columns()`, `to_csv()`, and `to_arrow()` methods. These methods
return a `promise` for the calculated data:

Via `Promise`

```javascript
// an array of objects representing each row
view.to_json().then((json) => console.log(json));

// an object of arrays representing each column
view.to_columns().then((json) => console.log(json));

// a CSV-formatted string
view.to_csv().then((csv) => console.log(csv));

// an Arrow binary serialized to ArrayBuffer
view.to_arrow().then((arrow) => console.log(arrow));
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
`view()` store their associated data in the WebAssembly heap. Because of this,
as well as the current lack of a hook into the JavaScript runtime's garbage
collector from WebAssembly, the memory allocated to these Perspective objects
does not automatically get cleaned up when the object falls out of scope.

In order to prevent memory leaks and reclaim the memory associated with a
Perspective `table()` or `view()`, you must call the `delete()` method:

```javascript
await view.delete();

// This method will throw an exception if there are still `view()`s depending
// on this `table()`!
await table.delete();
```

## `perspective-viewer` web component library

`<perspective-viewer>` provides a complete graphical UI for configuring the
`perspective` library and formatting its output to the provided visualization
plugins.

If you are using `webpack` or another bundler which supports ES6 modules, you
only need to import the `perspective-viewer` libraries somewhere in your
application - these modules export nothing, but rather register the components
for use within your site's regular HTML:

```javascript
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
```

Once imported, the `<perspective-viewer>` Web Component will be available in any
standard HTML on your site. A simple example:

```html
<perspective-viewer id="view1"></perspective-viewer>
```

or

```javascript
const viewer = document.createElement("perspective-viewer");
```

### Theming

Theming is supported in `perspective-viewer` and its accompanying plugins. A
number of themes come bundled with `perspective-viewer`; you can import any of
these themes directly into your app, and the `perspective-viewer`s will be
themed accordingly:

```javascript
// Themes based on Thought Merchants's Prospective design
import "@finos/perspective-viewer/dist/css/pro.css";
import "@finos/perspective-viewer/dist/css/pro-dark.css";

// Other themes
import "@finos/perspective-viewer/dist/css/solarized.css";
import "@finos/perspective-viewer/dist/css/solarized-dark.css";
import "@finos/perspective-viewer/dist/css/monokai.css";
import "@finos/perspective-viewer/dist/css/vaporwave.css";
```

Alternatively, you may use `themes.css`, which bundles all default themes

```javascript
import "@finos/perspective-viewer/dist/css/themes.css";
```

If you choose not to bundle the themes yourself, they are available through
[CDN](https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/). These
can be directly linked in your HTML file:

```html
<link
    rel="stylesheet"
    crossorigin="anonymous"
    href="https://cdn.jsdelivr.net/npm/@finos/perspective-viewer/dist/css/pro.css"
/>
```

Note the `crossorigin="anonymous"` attribute. When including a theme from a
cross-origin context, this attribute may be required to allow
`<perspective-viewer>` to detect the theme. If this fails, additional themes are
added to the `document` after `<perspective-viewer>` init, or for any other
reason theme auto-detection fails, you may manually inform
`<perspective-viewer>` of the available theme names with the `.resetThemes()`
method.

```javascript
// re-auto-detect themes
viewer.resetThemes();

// Set available themes explicitly (they still must be imported as CSS!)
viewer.resetThemes(["Pro Light", "Pro Dark"]);
```

`<perspective-viewer>` will default to the first loaded theme when initialized.
You may override this via `.restore()`, or provide an initial theme by setting
the `theme` attribute:

```html
<perspective-viewer theme="Pro Light"></perspective-viewer>
```

or

```javascript
const viewer = document.querySelector("perspective-viewer");
viewer.restore({ theme: "Pro Dark" });
```

### Loading data into `<perspective-viewer>`

Data can be loaded into `<perspective-viewer>` in the form of a `Table()` or a
`Promise<Table>` via the `load()` method.

```javascript
// Create a new worker, then a new table promise on that worker.
const table = await perspective.worker().table(data);

// Bind a viewer element to this table.
viewer.load(table);
```

### Sharing a `table()` between multiple `perspective-viewer`s

Multiple `perspective-viewer`s can share a `table()` by passing the `table()`
into the `load()` method of each viewer. Each `perspective-viewer` will update
when the underlying `table()` is updated, but `table.delete()` will fail until
all `perspective-viewer` instances referencing it are also deleted:

```javascript
const viewer1 = document.getElementById("viewer1");
const viewer2 = document.getElementById("viewer2");

// Create a new WebWorker
const worker = perspective.worker();

// Create a table in this worker
const table = await worker.table(data);

// Load the same table in 2 different <perspective-viewer> elements
viewer1.load(table);
viewer2.load(table);

// Both `viewer1` and `viewer2` will reflect this update
table.update([{ x: 5, y: "e", z: true }]);
```

### Server-only via `WebSocketServer()` and Node.js

For exceptionally large datasets, a `<perspective-viewer>` can be bound to a
`perspective.table()` instance running in Node.js remotely, rather than creating
one in a Web Worker and downloading the entire data set. This trades off network
bandwidth and server resource requirements for a smaller browser memory and CPU
footprint.

In Node.js:

```javascript
const { WebSocketServer, table } = require("@finos/perspective");
const fs = require("fs");

// Start a WS/HTTP host on port 8080.  The `assets` property allows
// the `WebSocketServer()` to also serves the file structure rooted in this
// module's directory.
const host = new WebSocketServer({ assets: [__dirname], port: 8080 });

// Read an arrow file from the file system and host it as a named table.
const arr = fs.readFileSync(__dirname + "/superstore.arrow");
table(arr).then((table) => {
    host.host_table("table_one", table);
});
```

In the browser:

```javascript
const elem = document.getElementsByTagName("perspective-viewer")[0];

// Bind to the server's worker instead of instantiating a Web Worker.
const websocket = perspective.websocket(
    window.location.origin.replace("http", "ws")
);

// Bind the viewer to the preloaded data source.  `table` and `view` objects
// live on the server.
const server_table = await websocket.open_table("table_one");
elem.load(server_table);

// Or load data from a table using a view. The browser now also has a copy of
// this view in its own `table`, as well as its updates transferred to the
// browser using Apache Arrow.
const worker = perspective.worker();
const server_view = await server_table.view();
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
API, see the [Python user guide](python.md) or the
[Python API documentation](obj/perspective-python.md).

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
    window.addEventListener("DOMContentLoaded", async function () {
        // Create a client that expects a Perspective server
        // to accept connections at the specified URL.
        const websocket = perspective.websocket(
            "ws://localhost:8888/websocket"
        );

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

Any operation performed on the `<perspective-viewer>` instance or on `table`
will be forwarded to Python, which will execute the operation and return the
results back to JavaScript.

### Persistent `<perspective-viewer>` configuration via `save()`/`restore()`.

`<perspective-viewer>` is _persistent_, in that its entire state (sans the data
itself) can be serialized or deserialized. This include all column, filter,
pivot, expressions, etc. properties, as well as datagrid style settings, config
panel visibility, and more. This overloaded feature covers a range of use cases:

-   Setting a `<perspective-viewer>`'s initial state after a `load()` call.
-   Updating a single or subset of properties, without modifying others.
-   Resetting some or all properties to their data-relative default.
-   Persisting a user's configuration to `localStorage` or a server.

#### Serializing and deserializing the viewer state

To retrieve the entire state as a JSON-ready JavaScript object, use the `save()`
method. `save()` also supports a few other formats such as `"arraybuffer"` and
`"string"` (base64, not JSON), which you may choose for size at the expense of
easy migration/manual-editing.

```javascript
const json_token = await elem.save();
const string_token = await elem.save("string");
```

For any format, the serialized token can be restored to any
`<perspective-viewer>` with a `Table` of identical schema, via the `restore()`
method. Note that while the data for a token returned from `save()` may differ,
generally its schema may not, as many other settings depend on column names and
types.

```javascript
await elem.restore(json_token);
await elem.restore(string_token);
```

As `restore()` dispatches on the token's type, it is important to make sure that
these types match! A common source of error occurs when passing a
JSON-stringified token to `restore()`, which will assume base64-encoded msgpack
when a string token is used.

```javascript
// This will error!
await elem.restore(JSON.stringify(json_token));
```

#### Updating individual properties

Using the JSON format, every facet of a `<perspective-viewer>`'s configuration
can be manipulated from JavaScript using the `restore()` method. The valid
structure of properties is described via the
[`ViewerConfig`](https://github.com/finos/perspective/blob/ebced4caa/rust/perspective-viewer/src/ts/viewer.ts#L16)
and embedded
[`ViewConfig`](https://github.com/finos/perspective/blob/ebced4caa19435a2a57d4687be7e428a4efc759b/packages/perspective/index.d.ts#L140)
type declarations, and [`View`](view.md) chapter of the documentation which has
several interactive examples for each `ViewConfig` property.

```javascript
// Set the plugin (will also update `columns` to plugin-defaults)
await elem.restore({ plugin: "X Bar" });

// Update plugin and columns (only draws once)
await elem.restore({ plugin: "X Bar", columns: ["Sales"] });

// Open the config panel
await elem.restore({ settings: true });

// Create an expression
await elem.restore({
    columns: ['"Sales" + 100'],
    expressions: ['"Sales" + 100'],
});

// ERROR if the column does not exist in the schema or expressions
// await elem.restore({columns: ["\"Sales\" + 100"], expressions: []});

// Add a filter
await elem.restore({ filter: [["Sales", "<", 100]] });

// Add a sort, don't remove filter
await elem.restore({ sort: [["Prodit", "desc"]] });

// Reset just filter, preserve sort
await elem.restore({ filter: undefined });

// Reset all properties to default e.g. after `load()`
await elem.reset();
```

Another effective way to quickly create a token for a desired configuration is
to simply copy the token returned from `save()` after settings the view manually
in the browser. The JSON format is human-readable and should be quite easy to
tweak once generated, as `save()` will return even the default settings for all
properties. You can call `save()` in your application code, or e.g. through the
Chrome developer console:

```javascript
// Copy to clipboard
copy(await document.querySelector("perspective-viewer").save());
```

### Update events

Whenever a `<perspective-viewer>`s underlying `table()` is changed via the
`load()` or `update()` methods, a `perspective-view-update` DOM event is fired.
Similarly, `view()` updates instigated either through the Attribute API or
through user interaction will fire a `perspective-config-update` event:

```javascript
elem.addEventListener("perspective-config-update", function (event) {
    var config = elem.save();
    console.log("The view() config has changed to " + JSON.stringify(config));
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
elem.addEventListener("perspective-click", function (event) {
    var config = event.detail.config;
    elem.restore(config);
});
```
