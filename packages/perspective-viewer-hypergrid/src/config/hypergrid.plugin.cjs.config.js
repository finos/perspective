const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/hypergrid.js",
    externals: [/^[a-z0-9\@].*$/],
    output: {
        filename: "hypergrid.plugin.cjs.js",
        library: "perspective-view-hypergrid",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname, "../../build")
    }
});
