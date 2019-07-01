const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./dist/cjs/perspective-viewer-hypergrid.js",
    output: {
        filename: "perspective-viewer-hypergrid.js",
        library: "perspective-viewer-hypergrid",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist/umd")
    }
});
