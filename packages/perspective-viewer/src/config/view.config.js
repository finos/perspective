const path = require("path");
const common = require("../../../../scripts/webpack/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/viewer.js",
    output: {
        filename: "perspective.view.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});
