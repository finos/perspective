const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");
const {dependencies} = require("../../package.json");

const externals = Object.keys(dependencies);

module.exports = Object.assign({}, common({no_minify: true}), {
    devtool: false,
    entry: "./src/js/viewer.js",
    output: {
        filename: "perspective-viewer.js",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname, "../../cjs")
    },
    externals
});
