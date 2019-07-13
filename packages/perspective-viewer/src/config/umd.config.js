const path = require("path");
const fs = require("fs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const common = require("@finos/perspective/src/config/common.config.js");

const THEMES = fs.readdirSync(path.resolve(__dirname, "..", "themes"));
const CONFIG = common();

CONFIG.plugins.push(
    new MiniCssExtractPlugin({
        splitChunks: {
            chunks: "all"
        },
        filename: "[name].css"
    })
);

function try_delete(name) {
    const filePath = path.resolve(__dirname, "..", "..", "dist", "umd", name);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

CONFIG.plugins.push({
    apply: compiler => {
        compiler.hooks.afterEmit.tap("AfterEmitPlugin", () => {
            for (const theme of THEMES) {
                try_delete(theme.replace("less", "js"));
                try_delete(theme.replace("less", "js.map"));
                try_delete(theme.replace("less", "css.map"));
            }
        });
    }
});

CONFIG.module.rules.push({
    test: /\.(woff|ttf|eot|svg|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    loader: "base64-font-loader"
});

CONFIG.module.rules.push({
    test: /themes[\\/].+?\.less$/,
    use: [{loader: MiniCssExtractPlugin.loader}, "css-loader", "less-loader"]
});

function reducer(obj, key, val) {
    obj[key] = val;
    return obj;
}

module.exports = Object.assign({}, CONFIG, {
    entry: THEMES.reduce((obj, theme) => reducer(obj, theme.replace(".less", ""), path.resolve(__dirname, "..", "themes", theme)), {"perspective-viewer": "./dist/cjs/perspective-viewer.js"}),
    output: {
        filename: "[name].js",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist/umd")
    }
});
