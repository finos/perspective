const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, (config) => {
    return Object.assign(config, {
        entry: {
            "perspective-viewer": "./dist/esm/index.js",
        },
        output: {
            filename: "[name].js",
            chunkFilename: "perspective-viewer.[name].js",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "./dist/umd"),
            assetModuleFilename: "[name][ext][query]",
        },
        experiments: {
            syncWebAssembly: true,
        },
    });
});
