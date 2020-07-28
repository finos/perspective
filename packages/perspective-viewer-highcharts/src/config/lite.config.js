const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config =>
    Object.assign(config, {
        entry: "./dist/esm/lite.js",
        externals: [/^[a-z0-9@]/],
        output: {
            filename: "perspective-viewer-highcharts-lite.js",
            library: "perspective-viewer-highcharts",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/cjs")
        }
    })
);
