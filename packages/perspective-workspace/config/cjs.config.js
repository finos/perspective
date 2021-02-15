const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config =>
    Object.assign(config, {
        entry: "./dist/esm/index.js",
        externals: [/^[a-z0-9@]/],
        output: {
            filename: "perspective-workspace.js",
            library: "perspective-workspace",
            libraryTarget: "commonjs2",
            path: path.resolve(__dirname, "../dist/cjs")
        },
        experiments: {
            syncWebAssembly: true
        }
    })
);
