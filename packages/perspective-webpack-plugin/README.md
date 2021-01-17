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
## Configuration _without_ `@finos/perspective-webpack-plugin`

As of version `0.6.1`, the equivalent webpack config is quite simple:

```javascript
module.exports = {
    // ...

    rules: [
        // ...

        {
            test: /perspective\.worker\.js$/,
            type: "javascript/auto",
            include: path.dirname(require.resolve("@finos/perspective")),
            loader: "worker-loader"
        },
        {
            test: /perspective\.cpp\.wasm$/,
            type: "javascript/auto",
            include: path.dirname(require.resolve("@finos/perspective-cpp")),
            loader: "file-loader"
        }
    ],
    resolve: {
        // ...

        fallback: {
            // ...

            fs: false,
            path: false
        }
    }
};
```

## `0.4.4` and below

These versions pre-date In order to use Perspective via webpack, so this
plugin is a requirement.

