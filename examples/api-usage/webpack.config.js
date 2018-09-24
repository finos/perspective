const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    context: __dirname,
    entry: "./src/index.js",
    mode: "development",
    plugins: [
        new CopyWebpackPlugin([
            {
                from: "./src/index.html",
            },
            {
                from: "./node_modules/@jpmorganchase/perspective/build/perspective.worker.*",
                to: "[name].[ext]"
            },
            {
                from: "./node_modules/@jpmorganchase/perspective/build/*.wasm",
                to: "[name].[ext]"
            }
        ])
    ]
};
