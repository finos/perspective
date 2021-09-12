const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, (config) =>
    Object.assign(config, {
        entry: "./dist/esm/index.js",
        externals: [/^[a-z0-9@]/],
        output: {
            filename: "perspective-viewer-d3fc.js",
            library: "perspective-view-d3fc",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/cjs"),
        },
    })
);
