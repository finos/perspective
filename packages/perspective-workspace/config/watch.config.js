const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config => {
    config.module.rules.push({
        test: /\.js$/,
        use: [{loader: "babel-loader"}]
    });
    return Object.assign(config, {
        entry: "./src/js/index.js",
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
    });
});
