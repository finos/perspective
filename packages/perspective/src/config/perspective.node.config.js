const path = require("path");
const common = require("./common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/perspective.node.js",
    target: "node",
    externals: [/^([a-z0-9]|\@(?!apache\-arrow)).*$/],
    plugins: [],
    node: {},
    output: {
        filename: "perspective.node.js",
        path: path.resolve(__dirname, "../../build"),
        libraryTarget: "umd"
    }
});

module.exports.module.rules.push({
    test: /\.wasm$/,
    loader: "arraybuffer-loader"
});
