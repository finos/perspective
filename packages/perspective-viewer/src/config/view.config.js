const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: ["./src/js/view.js", "./src/less/default.less"],
    output: {
        filename: "perspective.view.js",
        library: "perspective-view",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});
