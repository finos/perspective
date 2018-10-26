const path = require("path");
const common = require("./common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/perspective.parallel.js",
    externals: [/node_modules\/\@(?!apache-arrow)/, /perspective.node.js/],
    output: {
        filename: "perspective.cjs.js",
        library: "perspective",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname, "../../build")
    }
});
