---
id: installation
title: Installation
sidebar_label: Installation
---

## From CDN

Perspective can be used direct from [unpkg.com](https://unpkg.com/@jpmorganchase/perspective-examples/build/perspective.view.js),
though for production you'll ultimately want to install this via another 
option below:

```html
<script src="https://unpkg.com/@jpmorganchase/perspective-examples/build/perspective.view.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-examples/build/hypergrid.plugin.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-examples/build/highcharts.plugin.js"></script>
```

## From NPM

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

## From source

Perspective is organized as a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md), 
and uses [lerna](https://lernajs.io/) to manage dependencies.

`@jpmorganchase/perspective` has an additional dependency, 
[emscripten](https://github.com/kripken/emscripten), to compile the core C++ 
engine.  For convenience, Perspective provides a Docker container for this.
To use it, you only need to install [Docker](https://docs.docker.com/install/) 
itself, then build perspective via:

```bash
npm install
PSP_DOCKER=1 npm run build
```

If everything is successful, you should find a few built example assets in the 
`packages/perspective-examples/build` directory.  You can run a simple test 
server on port 8080 to host these by running:

```bash
./node_modules/.bin/lerna run host --stream
```

### EMSDK

If you don't want to use Docker for the build, you'll need to install the 
emscripten SDK, then activate and export the latest `emsdk` environment via 
[`emsdk_env.sh`](https://github.com/juj/emsdk):
  
```bash
source emsdk/emsdk_env.sh
```

#### OSX specific instructions

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

#### Windows 10 specific instructions

You need to use bash in order to build Perspective packages. To successfully 
build on Windows 10, enable [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10) 
(WSL) and install the linux distribution of your choice. 

Create symbolic link to easily access Windows directories and projects modified 
via Windows. This way you can modify any of the Perspective files using your 
favorite editors on Windows and build via Linux.

Follow the Linux specific instructions to install Emscripten and all
prerequisite tools.

#### Ubuntu/Debian

When installing Emscripten, make sure to follow [Linux specific instructions](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html#linux).  

On Ubuntu, cmake will mistakenly resolve the system headers in `/usr/include` 
rather than the emscripten supplied versions.  You can resolve this by moving
boost to somewhere other than `/use/include` - into perspective's own `src` dir,
for example (as per [here](http://vclf.blogspot.com/2014/08/emscripten-linking-to-boost-libraries.html)).

```bash
apt-get install libboost-all-dev
cp -r /usr/include/boost ./packages/perspective/src/include/
```

### Options

The build script respects a few environment flags:

* `PSP_DOCKER` will compile C++ source via an Emscripten Docker container.
* `PSP_DEBUG` will run a debug build of the C++ source.
* `PSP_NO_MINIFY` will skip Javascript minification.

## Hosting

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