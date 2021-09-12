const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, (config) =>
    Object.assign(config, {
        entry: "./dist/esm/index.js",
        output: {
            filename: "perspective-workspace.js",
            library: "perspective-workspace",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../dist/umd"),
        },
        experiments: {
            syncWebAssembly: true,
        },
    })
);
