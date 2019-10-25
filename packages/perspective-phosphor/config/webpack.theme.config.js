const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");

module.exports = {
    mode: "production",
    entry: {
        material: path.join(__dirname, "../src/theme/material/index.less"),
        vaporwave: path.join(__dirname, "../src/theme/vaporwave/index.less")
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new FixStyleOnlyEntriesPlugin()
    ],

    output: {
        path: path.resolve(__dirname, "../dist/themes/")
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
};
