const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config => {
    return Object.assign(config, {
        entry: {"perspective-viewer": "./dist/esm/viewer.js"},
        output: {
            filename: "[name].js",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/umd")
        }
    });
});
