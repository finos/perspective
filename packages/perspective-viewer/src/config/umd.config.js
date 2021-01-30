const path = require("path");
const fs = require("fs");
const cssnano = require("cssnano");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const common = require("@finos/perspective/src/config/common.config.js");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const THEMES = fs.readdirSync(path.resolve(__dirname, "..", "themes"));

function try_delete(name) {
    const filePath = path.resolve(__dirname, "..", "..", "dist", "umd", name);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function reducer(obj, key, val) {
    obj[key] = val;
    return obj;
}

module.exports = common({}, config => {
    config.plugins.push(
        new MiniCssExtractPlugin({
            filename: "[name].css"
        })
    );

    config.plugins.push({
        apply: compiler => {
            compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
                for (const theme of THEMES) {
                    try_delete(theme.replace("less", "js"));
                    try_delete(theme.replace("less", "js.map"));
                }
            });
        }
    });

    config.plugins.push(new FixStyleOnlyEntriesPlugin());
    config.module.rules.push({
        test: /\.(woff|ttf|eot|svg|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "base64-font-loader"
    });

    config.module.rules.push({
        test: /themes[\\/].+?\.less$/,
        use: [
            {loader: MiniCssExtractPlugin.loader},
            "css-loader",
            {
                loader: "postcss-loader",
                options: {
                    postcssOptions: {
                        minimize: true,
                        plugins: [
                            cssnano({
                                preset: "lite"
                            })
                        ]
                    }
                }
            },
            "less-loader"
        ]
    });

    return Object.assign(config, {
        entry: THEMES.reduce((obj, theme) => reducer(obj, theme.replace(".less", ""), path.resolve(__dirname, "..", "themes", theme)), {"perspective-viewer": "./dist/cjs/perspective-viewer.js"}),
        output: {
            filename: "[name].js",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/umd")
        }
    });
});
