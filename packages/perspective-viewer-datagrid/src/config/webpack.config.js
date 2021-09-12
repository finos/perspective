const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, (config) =>
    Object.assign(config, {
        entry: "./dist/esm/perspective-viewer-datagrid.js",
        output: {
            filename: "perspective-viewer-datagrid.js",
            library: "perspective-viewer-datagrid",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/umd"),
        },
    })
);
