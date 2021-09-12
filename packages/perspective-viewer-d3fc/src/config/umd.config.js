const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, (config) =>
    Object.assign(config, {
        entry: "./dist/cjs/perspective-viewer-d3fc.js",
        output: {
            filename: "perspective-viewer-d3fc.js",
            library: "perspective-view-d3fc",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/umd"),
        },
    })
);
