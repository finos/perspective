The JavaScript language bindings for
[Perspective](https://perspective.finos.org).

<div class="warning">
The examples in this module are in JavaScript. See <a href="https://docs.rs/crate/perspective/latest"><code>perspective</code></a> docs for the Rust API.
</div>

Perspective's JavaScript library offers a configurable UI powered by a fast
streaming data engine. Developers are able to pick and choose the modules they
require for their use case, and users are presented with a clean user interface
through which to analyze data. A simple example which loads an
[Apache Arrow](https://arrow.apache.org/) and computes a "Group By" operation,
returning a new Arrow:

```javascript
import perspective from "@finos/perspective";

const table = await perspective.table(apache_arrow_data);
const view = await table.view({ group_by: ["CounterParty", "Security"] });
const arrow = await view.to_arrow();
```

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
$ npm add @finos/perspective
```

### From NPM (Browser)

For using Perspective as a dependency in a `webpack` (or other bundler) app,
Perspective's WebAssembly data engine is available via NPM in the same package,
`@finos/perspective`. For the `@finos/perspective-viewer` UI, a few additional
packages are required:

```bash
$ npm add @finos/perspective @finos/perspective-viewer @finos/perspective-viewer-d3fc @finos/perspective-viewer-datagrid
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

-   `esbuild` via `@finos/perspective-esbuild-plugin`
-   Webpack via `@finos/perspective-webpack-plugin`

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
});
```

When bundling via `esbuild`, you must also

-   Use the `type="module"` attribute in your app's `<script>` tag, as this
    build mode is only supported via ES modules.
-   Use the direct imports for the `esm` versions Perspective, specifically
    `@finos/perspective/dist/esm/perspective.js` and
    `@finos/perspective-viewer/dist/esm/perspective-viewer.js`

### From CDN

Perspective can be loaded directly from most CDNs, such as
[jsdelivr.com](https://www.jsdelivr.com/package/npm/@finos/perspective-viewer),
which is the easiest way to get started with Perspective in the browser, and
perfect for spinning up quick instances of `perspective-viewer` without
installing or bundling.

While CDNs are great for development builds and small apps, for production usage
you should incorporate Perspective into your application with a bundler like
`Webpack`, described above.

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
    const worker = await perspective.worker();
    const table = worker.table({ x: [1, 2, 3, 4, 5] });
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
Node.js). See the
[API documentation](<[/obj/perspective.md](https://docs.rs/perspective-js/latest/perspective_js/)>)
for a complete reference on all exported methods. This module is a dependency of
`@finos/perspective-viewer`, and is not needed if you only intend to use
`<perspective-viewer>` to visualize simple data.

### Importing in the browser

`perspective` can be imported as an ES6 module and/or `require` syntax if you're
using a bundler such as ESBuild (and the `@finos/perspective-esbuild-plugin`):

```javascript
import perspective from "@finos/perspective";
```

#### Instantiating a new `worker()`

Once imported, you'll need to instantiate a `perspective` engine via the
`worker()` method. This will create a new Web Worker (browser) or Process
(Node.js) and load the WebAssembly binary; all calculation and data accumulation
will occur in this separate process.

```javascript
const worker = await perspective.worker();
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

Via `await`/`async`

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

### Server-only via `WebSocketServer()` and Node.js

For exceptionally large datasets, a `Client` can be bound to a
`perspective.table()` instance running in Node.js/Python/Rust remotely, rather
than creating one in a Web Worker and downloading the entire data set. This
trades off network bandwidth and server resource requirements for a smaller
browser memory and CPU footprint.

An example in Node.js:

```javascript
const { WebSocketServer, table } = require("@finos/perspective");
const fs = require("fs");

// Start a WS/HTTP host on port 8080.  The `assets` property allows
// the `WebSocketServer()` to also serves the file structure rooted in this
// module's directory.
const host = new WebSocketServer({ assets: [__dirname], port: 8080 });

// Read an arrow file from the file system and host it as a named table.
const arr = fs.readFileSync(__dirname + "/superstore.lz4.arrow");
await table(arr, { name: "table_one" });
```

... and the [`Client`] implementation in the browser:

```javascript
const elem = document.getElementsByTagName("perspective-viewer")[0];

// Bind to the server's worker instead of instantiating a Web Worker.
const websocket = await perspective.websocket(
    window.location.origin.replace("http", "ws")
);

// Create a virtual `Table` to the preloaded data source.  `table` and `view`
// objects live on the server.
const server_table = await websocket.open_table("table_one");
```
