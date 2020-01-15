const path = require("path");
const common = require("./common.config.js");
const {minimizer} = require("./minimizer.js");

module.exports = common({inline: true}, config =>
    Object.assign(config, {
        entry: "./dist/esm/perspective.parallel.js",
        output: {
            filename: "perspective.inline.js",
            library: "perspective",
            libraryTarget: "umd",
            libraryExport: "default",
            path: path.resolve(__dirname, "../../dist/umd")
        },
        optimization: {
            minimizer: minimizer
        }
    })
);
