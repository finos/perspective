const path = require("path");
const common = require("./common.config.js");

module.exports = Object.assign({}, common({build_worker: true}), {
    entry: "./src/js/perspective.parallel.js",
    output: {
        filename: "perspective.js",
        library: "perspective",
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, "../../build")
    }
});
