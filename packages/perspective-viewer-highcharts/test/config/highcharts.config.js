const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/highcharts.js",
    output: {
        filename: "highcharts.plugin.js",
        library: "perspective-view-highcharts",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});
