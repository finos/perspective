const path = require("path");
const common = require("./common.config.js");

module.exports = common({}, (config) =>
    Object.assign(config, {
        entry: "./dist/esm/perspective.parallel.js",
        output: {
            filename: "perspective.js",
            library: "perspective",
            libraryTarget: "umd",
            libraryExport: "default",
            chunkFilename: "perspective.chunk_[id].js",
            path: path.resolve(__dirname, "../../dist/umd"),
            assetModuleFilename: "[name][ext][query]",
        },
    })
);
