# `@finos/perspective-esbuild-plugin`

Applications bundled with `esbuild` can make use of the
`@finos/perspective-esbuild-plugin` module. A full example can be found in the
repo under [`examples/esbuild-example`](https://github.com/finos/perspective/tree/master/examples/esbuild-example).

```javascript
const esbuild = require("esbuild");
const {PerspectiveEsbuildPlugin} = require("@finos/perspective-esbuild-plugin");

esbuild.build({
    entryPoints: ["src/index.js"],
    plugins: [PerspectiveEsbuildPlugin()],
    format: "esm",
    bundle: true,
    loader: {
        ".ttf": "file",
    },
});
```

When bundling via `esbuild`, you must also:

-   Use the `type="module"` attribute in your app's `<script>` tag, as this
    build mode is only supported via ES modules.
-   Use the direct imports for the `esm` versions Perspective, specifically
    `@finos/perspective/dist/esm/perspective.js` and
    `@finos/perspective-viewer/dist/esm/perspective-viewer.js`
