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
`@jpmorganchase/perspective` and `@jpmorganchase/perspective-viewer` packages.

When importing from NPM modules, you should use
`@jpmorganchase/perspective-webpack-plugin` to manage the `.worker.*.js` and 
`.wasm` assets for you. A sample config:

```javascript
const PerspectivePlugin = require("@jpmorganchase/perspective-webpack-plugin");

module.exports = {
    entry: "./in.js",
    output: {
        filename: "out.js",
        path: "build"
    },
    plugins: [new PerspectivePlugin()]
};
```

Alternatively, you may use the built-in `WorkerHost` Node.js server, host
the contents of a package's `build/` in your application's build script, or
otherwise making sure these directories are visible to your web server, e.g.:

```javascript
cp -r node_modules/@jpmorganchase/perspective/build my_build/assets/
```

## From CDN

By far the easiest way to get started with Perspective in the browser, the full
library can be used directly from
[unpkg.com](https://unpkg.com/@jpmorganchase/perspective-examples/build/perspective.view.js)
CDN by simply adding these scripts to your `.html`'s `<head>` section:

```html
<script src="https://unpkg.com/@jpmorganchase/perspective"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer-hypergrid"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer-d3fc"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer-highcharts"></script>
```

Ultimately, for production you'll want Perspective incorporated directly into your
application's build script for load performance, via another option below.

## From NPM

For using Perspective from Node.js, or as a depedency in a `package.json` based
`webpack` or other browser application build toolchain, Perspective is available
via NPM

```bash
yarn add @jpmorganchase/perspective-viewer
yarn add @jpmorganchase/perspective-viewer-d3fc
yarn add @jpmorganchase/perspective-viewer-hypergrid
```

## From source

For hackers, contributors, and masochists, Perspective can be installed directly
from source available on [Github](https://github.com/jpmorganchase/perspective).
Doing so is quite a bit more complex than a standard pure Javascript NPM
package, so if you're not looking to hack on Perspective itself, you are likely
better off choosing the CDN or NPM methods above. See the
[developer docs](development.html) for details.

## Jupyterlab

Perspective comes bundled with a complete Jupyterlab plugin which can be
accessed from Python via the complementary 
[`perspective-python`](https://github.com/timkpaine/perspective-python)
package.  `perspective-python` implements mostly the same API as 
`<perspective-viewer>`, and works with static `pandas.DataFrame` objects as well
as streaming incremental updates via the `update()` method (as in Javascript).

<img src="https://jpmorganchase.github.io/perspective/img/jupyterlab.png"></img>

You'll need to install both to utilize Perspective from Python in Jupyterlab.
Assuming you've already installed the latter 3, you can install the Perspective 
plugin as below, or follow the install from source instructions from the 
`perspective-python` 
[documentation](https://perspective-python.readthedocs.io/en/latest/index.html).

```bash
pip install perspective-python
jupyter labextension install @jpmorganchase/perspective-jupyterlab
```

