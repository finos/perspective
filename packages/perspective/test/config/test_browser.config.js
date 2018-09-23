const path = require("path");
const common = require("../../src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./test/js/test_browser.js",
    plugins: [],
    output: {
        filename: "test_browser.js",
        path: path.resolve(__dirname, "../../build")
    }
});
