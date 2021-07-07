const path = require("path");
// const common = require("@finos/perspective/src/config/common.config.js");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");

module.exports = {
    mode: process.env.NODE_ENV || "development",
    entry: "./js/index.js",
    output: {
        filename: "index.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "static/js")
    },
    plugins: [new PerspectivePlugin({})],
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"]
            },
            {
                test: /\.less$/,
                use: [{loader: "style-loader"}, {loader: "css-loader"}, {loader: "less-loader"}]
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: "file-loader"
                    }
                ]
            }
        ]
    },
    devServer: {
        contentBase: [path.join(__dirname, "dist"), path.join(__dirname, "../../node_modules/superstore-arrow")]
    },
    devtool: "source-map",
    ignoreWarnings: [/Failed to parse source map/]
};
