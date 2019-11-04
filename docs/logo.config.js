const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./logo.js",
    output: {
        filename: "logo.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "static/js")
    }
});
