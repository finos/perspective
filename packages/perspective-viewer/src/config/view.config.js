const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./cjs/js/viewer.js",
    output: {
        filename: "perspective.view.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});
