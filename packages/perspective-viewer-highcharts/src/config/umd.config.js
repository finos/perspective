const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config =>
    Object.assign(config, {
        entry: "./dist/cjs/perspective-viewer-highcharts.js",
        output: {
            filename: "perspective-viewer-highcharts.js",
            library: "perspective-view-highcharts",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/umd")
        }
    })
);
