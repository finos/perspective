const path = require("path");
const common = require("../../src/config/common.config.js");

module.exports = Object.assign({}, common({no_minify: true}), {
    entry: "./test/js/test_browser.js",
    output: {
        filename: "test_browser.js",
        path: path.resolve(__dirname, "../../build")
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [{loader: "style-loader"}, {loader: "css-loader"}]
            }
        ]
    }
});
