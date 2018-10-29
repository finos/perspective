const path = require("path");
const common = require("../../src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./test/js/perspective.spec.js",
    target: "node",
    externals: [/^([a-z0-9]|\@(?!apache\-arrow)).*?(?!wasm)$/g],
    plugins: [],
    node: {
        __dirname: false,
        __filename: false
    },
    output: {
        filename: "perspective.spec.js",
        path: path.resolve(__dirname, "../../build"),
        libraryTarget: "umd"
    }
});
