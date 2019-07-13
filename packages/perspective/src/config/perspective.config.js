const path = require("path");
const common = require("./common.config.js");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = Object.assign({}, common({build_worker: true}), {
    entry: "./dist/esm/perspective.parallel.js",
    output: {
        filename: "perspective.js",
        library: "perspective",
        libraryTarget: "umd",
        libraryExport: "default",
        path: path.resolve(__dirname, "../../dist/umd")
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                test: /\.js(\?.*)?$/i,
                exclude: /(wasm|asmjs)/,
                sourceMap: true,
                terserOptions: {
                    keep_infinity: true
                }
            }),
            new TerserPlugin({
                cache: true,
                parallel: true,
                test: /wasm/,
                sourceMap: true,
                terserOptions: {
                    mangle: false,
                    keep_infinity: true
                }
            }),
            new TerserPlugin({
                cache: true,
                parallel: true,
                test: /asmjs/,
                exclude: /psp/,
                sourceMap: false,
                terserOptions: {
                    ecma: undefined,
                    warnings: false,
                    parse: undefined,
                    compress: false,
                    mangle: false,
                    module: false,
                    output: null,
                    toplevel: false,
                    nameCache: null,
                    ie8: true,
                    keep_classnames: true,
                    keep_fnames: true,
                    safari10: true
                }
            })
        ]
    }
});
