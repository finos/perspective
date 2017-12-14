# Perspective

Features:

- A fast, memory efficient streaming data engine written principally in C++ and
  compiled to both WebAssembly and asm.js via the
  [emscripten](https://github.com/kripken/emscripten) compiler.

- An embeddable UI framework for user engine configuration & visualization, based
  on [Web Components](https://www.webcomponents.org/).

- A suite of simple visualization plugins for some common Javascript libraries such as
  [HighCharts](https://github.com/highcharts/highcharts) and 
  [Hypergrid](https://github.com/fin-hypergrid/core).

- Runtimes for single process, Web Worker and Node.js

Try out an interactive [demo](https://jpmorganchase.github.io/perspective/examples/superstore.html), or keep reading to learn how to use
Perspective in your own project.

## Installation

### From source

You'll need [emscripten](https://github.com/kripken/emscripten) installed and 
resolveable on your PATH (via the `emsdk_env.sh`) in order to build from source.
Once installed, you can build perspective via:

```bash
npm install
./node_modules/.bin/lerna bootstrap --hoist
./node_modules/.bin/lerna run start --stream
```

If everything is successful, you should find a few built example assets in the 
`packages/perspective-examples/build` directory:

* [superstore.html](https://jpmorganchase.github.io/perspective/examples/superstore.html) A static `superstore.csv` demo page.
* [streaming.html](https://jpmorganchase.github.io/perspective/examples/streaming.html) A streaming random data demo page.
* [test.html](https://jpmorganchase.github.io/perspective/examples/test.html) The test suite.
* [benchmark.html](https://jpmorganchase.github.io/perspective/examples/benchmark.html) Some simple in-browser benchmarks.

You can run a simple test server on port 8081 by running:

```bash
./node_modules/.bin/lerna run host --stream
```

#### OSX specific instructions

As of this writing, the latest version of Emscripten does not correctly build on
OSX due to a [bug](https://github.com/kripken/emscripten/issues/5418) in `1.37.22`.
Instead of `latest`, you'll need to install and activate an older version: 

```bash
./emsdk install sdk-1.37.21-64bit
./emsdk active sdk-1.37.21-64bit
```

You'll also need Boost and CMake, which can be installed from Homebrew:

```bash
brew install cmake
brew install boost
```

### From NPM

Perspective is organized as a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md), 
and uses [lerna](https://lernajs.io/) to manage dependencies.  The main modules, 
all available via NPM, are:

- `@jpmorganchase/perspective`   
  The main library, as both a browser ES6 and Node.js module.  Provides an
  asm.js, WebAssembly, WebWorker (browser) and Process (node.js)
  implementation.

- `@jpmorganchase/perspective-viewer`  
  A configuration and visualizaiton (via plugins) UI, bundled as a [Web Component](https://www.webcomponents.org/introduction).

- `@jpmorganchase/perspective-viewer-hypergrid`  
  A perspective-viewer plugin for [Hypergrid](https://github.com/fin-hypergrid/core).

- `@jpmorganchase/perspective-viewer-highcharts`  
  A perspective-viewer plugin for [HighCharts](https://github.com/highcharts/highcharts).

## Usage

### A note on WebAssembly/asm.js in the browser

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

### Perspective library

As a library, `perspective` provides a suite of streaming pivot, aggregate, filter
and sort operations for tabular data.  The engine can be instantiated in process,
or in a Web Worker (browser only)

#### In the browser

Via ES6 module and/or Babel:

```javascript
import perspective from 'perspective';
```

or

```javascript
const perpective = require('perpective');
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
const perspective = require('perspective/build/perspective.node.js');
```

See [perspective-examples/node_server.js](https://github.com/jpmorganchase/perspective/blob/master/packages/perspective-examples/src/js/node_server.js)
for an example.

#### Usage

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

### Perspective-viewer web component

As a component, `perspective-viewer` provides a complete graphical UI for
configuring the `perspective` library and formatting its output to the
provided visualization plugins.

The `perspective-viewer` widget is packaged as a Web Component, and you'll need 
the [webcomponents.js polyfill](https://www.webcomponents.org/polyfills)
imported first in order to use it - e.g., from a CDN:

```html
<script src='https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/0.7.24/webcomponents.min.js'></script>
```    

If you are using babel or another build environment which supports ES6 modules,
you need only import the `perspective-viewer` libraries somewhere in your
application - these modules export nothing, but rather register the compoonents
for use within your site's regular HTML:

```javascript
import "prespective-viewer";
import "perspective-viewer-hypergrid";
import "perspective-viewer-highcharts";
```

Alternatively, you can just import the pre-bundled assets from the relevent NPM 
packages' `build/` directories:

```html 
<script src="perspective.view.js"></script>
<script src="hypergrid.plugin.js"></script>
<script src="highcharts.plugin.js"></script>
```

Once imported, the `<perspective viewer>` Web Component will be available in 
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

});
```

See [API Docs](https://github.com/jpmorganchase/perspective/tree/master/packages/perspective]) for more details.
