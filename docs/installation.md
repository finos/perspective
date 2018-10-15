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
better off choosing the CDN or NPM methods above. See the
[developer docs](development.html) for details.
