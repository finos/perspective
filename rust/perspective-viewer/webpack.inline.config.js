const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

let idx = 0;

module.exports = common({inline: true}, (config) => {
    return Object.assign(config, {
        entry: {
            "perspective-viewer": "./dist/esm/index.js",
        },
        output: {
            filename: "[name].inline.js",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "./dist/umd"),
        },
        experiments: {
            syncWebAssembly: true,
        },
    });
});
