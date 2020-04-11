const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config =>
    Object.assign(config, {
        entry: "./dist/esm/index.js",
        externals: [/^[a-z0-9@]/],
        output: {
            filename: "perspective-viewer-datagrid.js",
            library: "perspective-viewer-datagrid",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/cjs")
        }
    })
);
