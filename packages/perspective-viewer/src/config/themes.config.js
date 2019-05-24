const path = require("path");
//const fs = require("fs");
const common = require("@finos/perspective/src/config/common.config.js");
const fs = require("fs");
const WebpackOnBuildPlugin = require("on-build-webpack");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const THEMES = fs.readdirSync(path.resolve(__dirname, "..", "themes"));

module.exports = Object.assign({}, common(), {
    entry: "./src/js/themes.js",
    devtool: undefined,
    entry: THEMES.reduce((obj, theme) => {
        obj[theme.replace(".less", "")] = path.resolve(__dirname, "..", "themes", theme);
        return obj;
    }, {}),
    plugins: [
        new MiniCssExtractPlugin({
            splitChunks: {
                chunks: "all"
            },
            filename: "[name].css"
        }),
        new WebpackOnBuildPlugin(() => {
            for (const theme of THEMES) {
                const filePath = path.resolve(__dirname, "..", "..", "build", theme.replace("less", "js"));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        })
    ],
    stats: {
        modules: false
    },
    module: {
        rules: [
            {
                test: /\.(woff|ttf|eot|svg|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "base64-font-loader"
            },
            {
                test: /themes[\\/].+?\.less$/,
                use: [{loader: MiniCssExtractPlugin.loader}, "css-loader", "less-loader"]
            }
        ]
    },
    output: {
        filename: "[name].js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});
