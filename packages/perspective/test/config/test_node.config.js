const path = require("path");
const common = require("../../src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./test/js/perspective.spec.js",
    target: "node",
    externals: [/^([a-z0-9]|\@(?!apache\-arrow)).*$/],
    plugins: [],
    node: {},
    output: {
        filename: "perspective.spec.js",
        path: path.resolve(__dirname, "../../build"),
        libraryTarget: "umd"
    }
});

module.exports.module.rules.push({
    test: /\.wasm$/,
    loader: "arraybuffer-loader"
});
