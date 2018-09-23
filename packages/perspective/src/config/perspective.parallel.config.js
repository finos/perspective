const path = require("path");
const common = require("./common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/perspective.parallel.js",
    externals: [/^[a-z0-9\@].*$/],
    output: {
        filename: "perspective.umd.js",
        library: "perspective",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});
