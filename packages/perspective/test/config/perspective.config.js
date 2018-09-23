const path = require("path");
const common = require("../../src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/perspective.parallel.js",
    output: {
        filename: "perspective.js",
        library: "perspective",
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, "../../build")
    }
});
