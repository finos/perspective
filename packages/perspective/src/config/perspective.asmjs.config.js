const path = require("path");
const common = require("./common.config.js");

module.exports = Object.assign({}, common(), {
    entry: ["babel-polyfill", "./src/js/perspective.asmjs.js"],
    plugins: [],
    output: {
        filename: "perspective.worker.asmjs.js",
        path: path.resolve(__dirname, "../../build")
    }
});
