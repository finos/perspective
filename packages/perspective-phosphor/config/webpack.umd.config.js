const cjsConfig = require("./webpack.config");
const path = require("path");

module.exports = Object.assign({}, cjsConfig, {
    externals: [],
    output: {
        filename: "perspective-phosphor.js",
        library: "PerspectivePhosphor",
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, "../dist/umd")
    }
});
