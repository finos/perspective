const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./dist/esm/viewer.js",
    externals: [/^[a-z0-9@]/],
    output: {
        filename: "perspective-viewer.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist/cjs")
    }
});
