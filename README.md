# Perspective

[![Build Status](https://travis-ci.org/jpmorganchase/perspective.svg?branch=master)](https://travis-ci.org/jpmorganchase/perspective)

A streaming data visualization engine for Javascript, Perspective makes it 
simple to build real-time & user configurable analytics entirely in the browser.

<img src="https://jpmorganchase.github.io/perspective/examples/demo.gif">

## Features

- A fast, memory efficient streaming pivot engine written principally in C++ and
  compiled to both WebAssembly and asm.js via the
  [emscripten](https://github.com/kripken/emscripten) compiler.

- An embeddable, framework-agnostic configuration UI, based
  on [Web Components](https://www.webcomponents.org/), and a WebWorker engine 
  host for responsiveness at high frequency.

- A suite of simple visualization plugins for some common Javascript libraries such as
  [HighCharts](https://github.com/highcharts/highcharts) and 
  [Hypergrid](https://github.com/fin-hypergrid/core).

- Runtimes for the Browser and Node.js.

## Examples

* [superstore.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/superstore-arrow.html) A static `superstore.csv` demo.
* [citibike.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/citibike.html) NYC Citibike availability map.
* [streaming.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/streaming.html) A streaming random data demo.
* [coincap.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/coincap.html) Streaming crypto currency prices via [Coincap.io](http://coincap.io/).
* [theme-material.html](https://unpkg.com/@jpmorganchase/perspective-examples/build/theme-material.html) Material theme example.

## Installation

### From CDN

Perspective can be used direct from [unpkg.com](https://unpkg.com/@jpmorganchase/perspective-examples/build/perspective.view.js),
though for production you'll ultimately want to install this via another 
option below:

```html
<script src="https://unpkg.com/@jpmorganchase/perspective-examples/build/perspective.view.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-examples/build/hypergrid.plugin.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-examples/build/highcharts.plugin.js"></script>
```

### From NPM

The main modules available via NPM:

- `@jpmorganchase/perspective`   
  The main library, as both a browser ES6 and Node.js module.  Provides an
  asm.js, WebAssembly, WebWorker (browser) and Process (node.js)
  implementation.

- `@jpmorganchase/perspective-viewer`  
  A configuration and visualization (via plugins) UI, bundled as a [Web Component](https://www.webcomponents.org/introduction).

- `@jpmorganchase/perspective-viewer-hypergrid`  
  A perspective-viewer plugin for [Hypergrid](https://github.com/fin-hypergrid/core).

- `@jpmorganchase/perspective-viewer-highcharts`  
  A perspective-viewer plugin for [HighCharts](https://github.com/highcharts/highcharts).

- `@jpmorganchase/perspective-examples`  
  All perspective modules, bundled with their dependencies as standalone 
  Javascript files.

### From source

Perspective is organized as a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md), 
and uses [lerna](https://lernajs.io/) to manage dependencies.

`@jpmorganchase/perspective` has an additional dependency, 
[emscripten](https://github.com/kripken/emscripten), to compile the core C++ 
engine.  For convenience, Perspective provides a Docker container for this.
To use it, you only need to install [Docker](https://docs.docker.com/install/) 
itself, then build perspective via:

```bash
npm install
./node_modules/.bin/lerna run build --stream
```

If everything is successful, you should find a few built example assets in the 
`packages/perspective-examples/build` directory.  You can run a simple test 
server on port 8080 to host these by running:

```bash
./node_modules/.bin/lerna run host --stream
```

#### EMSDK

If you don't want to use Docker for the build, you'll need to install the 
emscripten SDK, then activate and export the latest `emsdk` environment via 
[`emsdk_env.sh`](https://github.com/juj/emsdk):
  
```bash
source emsdk/emsdk_env.sh
```
##### OSX specific instructions

Installing and activating the latest [emscriptn SDK]((https://github.com/kripken/emscripten)): 

```bash
./emsdk install latest
./emsdk activate latest
```

You'll also need Boost and CMake, which can be installed from Homebrew:

```bash
brew install cmake
brew install boost
```

##### Windows 10 specific instructions

You need to use bash in order to build Perspective packages. To successfully 
build on Windows 10, enable [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) 
(WSL) and install the linux distribution of your choice. 

Create symbolic link to easily access Windows directories and projects modified 
via Windows. This way you can modify any of the Perspective files using your 
favorite editors on Windows and build via Linux.

Follow the Linux specific instructions to install Emscripten and all
prerequisite tools.

##### Ubuntu/Debian

When installing Emscripten, make sure to follow [Linux specific instructions](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html#linux).  

On Ubuntu, cmake will mistakenly resolve the system headers in `/usr/include` 
rather than the emscripten supplied versions.  You can resolve this by moving
boost to somewhere other than `/use/include` - into perspective's own `src` dir,
for example (as per [here](http://vclf.blogspot.com/2014/08/emscripten-linking-to-boost-libraries.html)).

```bash
apt-get install libboost-all-dev
cp -r /usr/include/boost ./packages/perspective/src/include/
```

#### Options

The build script respects a few environment flags:

* `PSP_DEBUG` will run a debug build of the C++ source.
* `PSP_NO_MINIFY` will skip Javascript minification.

### Hosting

Whether you use just the `perspective` engine itself, or the 
`perspective-viewer` web component, your browser will need to
have access to the `.asm.js`, `.js.mem` and/or `.wasm` assets in addition to the 
bundled scripts themselves.  These can be found in the `perspective/build/asmjs`
and `perspective/build/wasm_async` directories of the package;  while the root level
`perspective/index.js` wrapper will automatically determine which runtime to
use based on your browser's WebAssembly support, you'll need to make sure to
copy both directories to the same relative directory you plan to host your
site bundle from:

      my_site.js (imports perspective)
      + wasm_async/
      |    perspective.js
      |    perspective.wasm
      + asmjs/
           perspective.js
           perspective.asm.js
           perspective.js.mem

In node, this can be achieved by hosting the contents of a packages `/build`:

```javascript
cp -r node_modules/@jpmorganchase/perspective/build my_build/assets/
```

## Usage

### Perspective library

[API Docs](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective)

As a library, `perspective` provides a suite of streaming pivot, aggregate, filter
and sort operations for tabular data.  The engine can be instantiated in process,
or in a Web Worker (browser only).

#### In the browser

Via ES6 module and/or Babel:

```javascript
import perspective from 'perspective';
```

or

```javascript
const perspective = require('perspective');
```

Perspective can also be referenced via the global `perspective` module name in vanilla
Javascript.

Once imported, you'll need to instance a `perspective` engine via the `worker()` 
method.  This will create a new WebWorker (browser) or Process (node.js), and 
load the appropriate supported WebAssembly or asm.js binary; all calculation
and data accumulation will occur in this separate process.

```javascript
const worker = perspective.worker();
```

#### In Node.js

```javascript
const perspective = require('@jpmorganchase/perspective/build/perspective.node.js');
```

See [perspective-examples/node_server.js](https://github.com/jpmorganchase/perspective/blob/master/packages/perspective-examples/src/js/node_server.js)
for an example.

#### `table()`

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
#### `view()`

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
### <perspective-viewer> web component

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


