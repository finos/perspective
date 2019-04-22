const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./cjs/js/index.js",
    output: {
        filename: "d3fc.plugin.js",
        library: "perspective-view-d3fc",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});
