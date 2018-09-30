---
id: installation
hide_title: true
---

# Installation <!-- omit in toc -->

## (!) An important note about Hosting

Whether you use just the `perspective` engine itself, or the
`perspective-viewer` web component, your browser will need to
have access to the `.worker.*.js` and `.wasm` assets in addition to the
bundled scripts themselves. These are downloaded asynchronously at runtime
after detecting whether or not WebAssembly is supported by your browser. The
assets can be found in the `build/` directory of the
`@jpmorganchase/perspective` and `@jpmorganchase/perspective-viewer` packages.

This can be achieved by using the built-in `WorkerHost` Node.js server, hosting
the contents of a packages `build/` in your application's build script, using
`webpack` and `CopyWebpackPlugin`, or otherwise making sure these directories
are visible to your web server, e.g.:

```javascript
cp -r node_modules/@jpmorganchase/perspective/build my_build/assets/
```

## From CDN

By far the easiest way to get started with Perspective in the browser, the full
library can be used directly from
[unpkg.com](https://unpkg.com/@jpmorganchase/perspective-examples/build/perspective.view.js)
CDN by simply adding these scripts to your `.html`'s `<head>` section:

```html
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer/build/perspective.view.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer-hypergrid/build/hypergrid.plugin.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer-highcharts/build/highcharts.plugin.js"></script>
```

Ultimately, for production you'll want Perspective incorporated directly into your
application's build script for load performance, via another option below.

## From NPM

For using Perspective from Node.js, or as a depedency in a `package.json` based
`webpack` or other browser application build toolchain, Perspective is available
via NPM

```bash
$ npm install --save @jpmorganchase/perspective-viewer \
@jpmorganchase/perspective-viewer-highcharts \
@jpmorganchase/perspective-viewer-hypergrid
```

## From source

For hackers, contributors, and masochists, Perspective can be installed directly
from source available on [Github](https://github.com/jpmorganchase/perspective).
Doing so is quite a bit more complex than a standard pure Javascript NPM
package, so if you're not looking to hack on Perspective itself, you are likely
better off choosing the CDN or NPM methods above.

Perspective is organized as a [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md),
and uses [lerna](https://lernajs.io/) to manage dependencies. The
`@jpmorganchase/perspective` modules has an additional, unmanaged dependency
however; the [Emscripten](https://github.com/kripken/emscripten) compiler, which
is used to compile the core C++ engine to WebAssembly, and must be installed
independently.

## From source

### Docker

For convenience, Perspective provides a Docker container for
this; To use it, you only need to install [Docker](https://docs.docker.com/install/)
itself, then build perspective via:

```bash
npm install
PSP_DOCKER=1 npm run build
```

If everything is successful, you should be able to run any of the `examples/`
packages, e.g. `examples/simple` like so:

```bash
npm start -- simple
```

### EMSDK

If you don't want to use Docker for the build, you'll need to install the
emscripten SDK, then activate and export the latest `emsdk` environment via
[`emsdk_env.sh`](https://github.com/juj/emsdk):

```bash
source emsdk/emsdk_env.sh
```

#### OSX specific instructions

Installing and activating the latest [emscripten SDK](https://github.com/kripken/emscripten):

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
rather than the emscripten supplied versions. You can resolve this by moving
boost to somewhere other than `/use/include` - into perspective's own `src` dir,
for example (as per [here](http://vclf.blogspot.com/2014/08/emscripten-linking-to-boost-libraries.html)).

```bash
apt-get install libboost-all-dev
cp -r /usr/include/boost ./packages/perspective/src/include/
```

### Build Options

Whichever method you choose, the build script respects a few environment flags:

-   `PSP_DOCKER` will compile C++ source via an Emscripten Docker container.
-   `PSP_DEBUG` will run a debug build of the C++ source.
-   `PSP_NO_MINIFY` will skip Javascript minification.
-   `PSP_CPU_COUNT` will set the concurrency limit for the build.
-   `PACKAGE` will restrict the build to only specific `@jpmorganchase/` packages.
