const cjsConfig = require("./webpack.config");
const path = require("path");
const PerspectiveWebpackPlugin = require("@finos/perspective-webpack-plugin");

module.exports = Object.assign({}, cjsConfig, {
    externals: [],
    plugins: [new PerspectiveWebpackPlugin()],
    output: {
        filename: "perspective-phosphor.js",
        library: "PerspectivePhosphor",
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, "../dist/umd")
    }
});
