const path = require("path");
const common = require("./common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/perspective.parallel.js",
    externals: [/^[a-z0-9\@].*$/],
    output: {
        filename: "perspective.cjs.js",
        library: "perspective",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname, "../../build")
    }
});
