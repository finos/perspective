# Perspective Webpack Plugin

For use with [Webpack](https://webpack.js.org/), this plugin allows smaller
& faster loading assets.  The plugin takes care of:

* Copying the Web Worker engine assets to your output directory.
* That's it!

Without this plugin or a manual equivalent of these steps, the WebAssembly
binary we be inlined as a `base64` string in the resulting `.js` asset, which
impacts total asset size and load time.  It will not in any way affect actual
runtime performance - the `inline` and `plugin` compilations modes are
otherwise identical.


## Example

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