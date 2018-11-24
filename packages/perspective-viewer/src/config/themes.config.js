const path = require("path");
const fs = require("fs");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = Object.assign({}, common(), {
    entry: "./src/js/themes.js",
    devtool: undefined,
    stats: {
        modules: false
    },
    module: {
        rules: [
            {
                test: /\.(woff|ttf|eot|svg|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "base64-font-loader"
            }
        ]
    },
    output: {
        filename: "__themes.js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../build")
    }
});

for (const file of fs.readdirSync("src/themes")) {
    const extract = new ExtractTextPlugin({filename: file.replace("less", "css")});
    module.exports.module.rules.push({
        test: new RegExp(file),
        loader: extract.extract({
            fallback: "style-loader",
            use: ["css-loader", "less-loader"]
        })
    });
    module.exports.plugins.push(extract);
}
