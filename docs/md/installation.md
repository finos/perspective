---
id: installation
title: Installation
---

## (!) An important note about Hosting

Whether you use just the `perspective` engine itself, or the
`perspective-viewer` web component, your browser will need to
have access to the `.worker.*.js` and `.wasm` assets in addition to the
bundled scripts themselves. These are downloaded asynchronously at runtime
after detecting whether or not WebAssembly is supported by your browser. The
assets can be found in the `build/` directory of the
`@finos/perspective` and `@finos/perspective-viewer` packages.

When importing from NPM modules, you should use
`@finos/perspective-webpack-plugin` to manage the `.worker.*.js` and 
`.wasm` assets for you. A sample config:

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

Alternatively, you may use the built-in `WebSocketServer` Node.js server, host
the contents of a package's `build/` in your application's build script, or
otherwise making sure these directories are visible to your web server, e.g.:

```javascript
cp -r node_modules/@finos/perspective/build my_build/assets/
```

## From CDN

By far the easiest way to get started with Perspective in the browser, the full
library can be used directly from
[unpkg.com](https://unpkg.com/@finos/perspective-examples/build/perspective-viewer.js)
CDN by simply adding these scripts to your `.html`'s `<head>` section:

```html
<script src="https://unpkg.com/@finos/perspective"></script>
<script src="https://unpkg.com/@finos/perspective-viewer"></script>
<script src="https://unpkg.com/@finos/perspective-viewer-hypergrid"></script>
<script src="https://unpkg.com/@finos/perspective-viewer-d3fc"></script>
```

Once added to your page, you can access the Javascript API through the `perspective` symbol:

```javascript
const worker = perspective.worker();
const table = worker.table({"A": [1, 2, 3]});
const view = table.view({sort: [["A", "desc"]]});
```

Or create a `<perspective-viewer>` in HTML:

```html
<perspective-viewer columns="['Sales', 'Profit']">`
<script>
const data = {
    "Sales": [500, 1000, 1500],
    "Profit": [100.25, 200.5, 300.75]
};
// The `<perspective-viewer>` HTML element exposes the viewer API
const el = document.getElementsByTagName('perspective-viewer')[0];
el.load(data);
</script>
```

Ultimately, for production you'll want Perspective incorporated directly into your
application's build script for load performance, via another option below.

## From NPM

For using Perspective from Node.js, or as a depedency in a `package.json` based
`webpack` or other browser application build toolchain, Perspective is available
via NPM:

```bash
yarn add @finos/perspective-viewer
yarn add @finos/perspective-viewer-d3fc
yarn add @finos/perspective-viewer-hypergrid
```

## From source

For hackers, contributors, and masochists, Perspective can be installed directly
from source available on [Github](https://github.com/finos/perspective).
Doing so is quite a bit more complex than a standard pure Javascript NPM
package, so if you're not looking to hack on Perspective itself, you are likely
better off choosing the CDN or NPM methods above. See the
[developer docs](development.html) for details.

## Python

`perspective-python` contains full bindings to the Perspective API, a JupyterLab widget,
and a [Tornado](http://www.tornadoweb.org/en/stable/) WebSocket handler that allows you to
host Perspective using server-side Python.

In addition to supporting row/columnar formats of data using `dict` and `list`, `pandas.DataFrame`,
dictionaries of NumPy arrays, NumPy structured arrays, and NumPy record arrays are all supported in `perspective-python`.

`perspective-python` can be installed from `pip`:

```bash
pip install perspective-python
```

### Jupyterlab

`PerspectiveWidget` is a JupyterLab widget that implements the same API as `<perspective-viewer>`,
allowing for fast, intuitive transformations/visualizations of various data formats within JupyterLab.

<img src="https://perspective.finos.org/img/jupyterlab.png"></img>

To use the JupyterLab plugin, make sure you have installed `perspective-python` and install from the 
Jupyter lab extension directory:

```bash
jupyter labextension install @finos/perspective-jupyterlab
```