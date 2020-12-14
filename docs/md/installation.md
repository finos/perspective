---
id: installation
title: Installation
---

## Javascript

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

#### An important note about Hosting

All uses of Perspective from NPM require the browser to have access to
Perspective's `.worker.*.js` and `.wasm` assets _in addition_ to the bundled
`.js` scripts. By default, Perspective [inlines](https://github.com/finos/perspective/pull/870)
these assets into the `.js` scripts, and delivers them in one file. This has no
performance impact, but does increase asset load time. Any non-trivial application
should make use of `@finos/perspective-webpack-plugin`, which automatically
splits the assets into separate files and downloads them when the bundling
step runs.

### Webpack Plugin

When importing `perspective` from NPM modules for a browser application, you
should use `@finos/perspective-webpack-plugin` to manage the `.worker.*.js` and
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
const table = await worker.table({A: [1, 2, 3]});
const view = await table.view({sort: [["A", "desc"]]});
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

You must wait for the document `WebComponentsReady` event to fire,
which indicates that the provided
[webcomponents.js polyfill](https://github.com/webcomponents/webcomponentsjs)
has loaded.

This makes it extremely easy to spin up Perspective locally without depending
on a build chain or other tooling. For production usage, you should incorporate
Perspective into your application's bundled scripts using `NPM` and `Webpack`.

## Python

`perspective-python` contains full bindings to the Perspective API, a JupyterLab
widget, and a [Tornado](http://www.tornadoweb.org/en/stable/) WebSocket handler
that allows you to host Perspective using server-side Python.

In addition to supporting row/columnar formats of data using `dict` and `list`,
`pandas.DataFrame`, dictionaries of NumPy arrays, NumPy structured arrays, and
NumPy record arrays are all supported in `perspective-python`.

`perspective-python` can be installed from `pip`:

```bash
pip install perspective-python
```

### Troubleshooting installation from source

If you are installing from a source distribution (sdist), make sure you have
CMake and Boost headers present on your machine:

- CMake (version 3.15.4 or higher)
- Boost Headers (version 1.67)

Try installing in verbose mode:

```bash
pip install -vv perspective-python
```

The most common culprits are:

- CMake version too old
- Boost headers are missing or too old
- PyArrow not installed prior to installing perspective

Additionally, due to PEP-518 and build isolation, its possible that the version of PyArrow that pip uses to build perspective-python is different from the one you have installed. To disable this, pass the `--no-build-isolation` flag to pip.

#### Wheels PyArrow linkage

Because we compile Apache Arrow from source to webassembly via Emscripten, we have a tight coupling on the specific version of Apache Arrow that must be used. As such, we link against a specific Apache Arrow version which must be present. Currently, our wheels build against PyArrow==0.17.1 for Python 3.* and PyArrow==0.16.0 for Python 2.7.

To ignore compiled wheels and install from source with pip, install via

```bash
pip install --no-binary perspective-python
```

### Jupyterlab

`PerspectiveWidget` is a JupyterLab widget that implements the same API as
`<perspective-viewer>`, allowing for fast, intuitive
transformations/visualizations of various data formats within JupyterLab.

<img src="https://perspective.finos.org/img/jupyterlab.png"></img>

To use the JupyterLab plugin, make sure you have installed `perspective-python`
and then install the extension from the Jupyter lab extension directory:

```bash
jupyter labextension install @finos/perspective-jupyterlab
```

If the widget does not display, you might be missing the [ipywidgets extension](https://ipywidgets.readthedocs.io/en/latest/user_install.html#installing-the-jupyterlab-extension). Install it from the extension directory:

```bash
jupyter labextension install @jupyter-widgets/jupyterlab-manager
```

## From source

For hackers, contributors, and masochists, Perspective can be installed directly
from source available on [Github](https://github.com/finos/perspective). Doing
so is quite a bit more complex than a standard pure Javascript NPM package, so
if you're not looking to hack on Perspective itself, you are likely better off
choosing the CDN or NPM methods above. See the
[developer docs](development.html) for details.
