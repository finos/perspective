const path = require("path");
const common = require("./common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/perspective.node.js",
    target: "node",
    externals: [/^([a-z0-9]|\@(?!apache\-arrow)).*?(?!wasm)$/g],
    node: {
        __dirname: false,
        __filename: false
    },
    output: {
        filename: "perspective.node.js",
        path: path.resolve(__dirname, "../../build"),
        libraryTarget: "umd"
    }
});
