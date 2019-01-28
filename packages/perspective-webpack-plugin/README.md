# Perspective Webpack Plugin

In order to use Perspective via webpack, you'll need this plugin.  The plugin
takes care of:

* Copying the Web Worker engine assets to your output directory.
* Handling cross-origin loading of the Web Worker assets.
* Packaging the LESS and HTML assets for the `perspective-viewer` webpack plugin.

Example:

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
