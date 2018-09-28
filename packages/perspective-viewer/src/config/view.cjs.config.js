const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/view.js",
    externals: [/^[a-z0-9\@].*$/],
    output: {
        filename: "perspective.view.cjs.js",
        library: "perspective-view",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname, "../../build")
    }
});
