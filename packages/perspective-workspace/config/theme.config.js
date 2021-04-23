const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");

module.exports = ["material", "material.dark"].map(x => ({
    mode: "production",
    entry: {
        [x]: path.join(__dirname, `../src/theme/${x}.less`)
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new FixStyleOnlyEntriesPlugin()
    ],
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
    output: {
        path: path.resolve(__dirname, "../dist/umd/")
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.less$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
            }
        ]
    }
}));
