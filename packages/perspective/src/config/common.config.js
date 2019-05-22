const webpack = require("webpack");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const plugins = [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)];

module.exports = function({build_worker, no_minify} = {}) {
    plugins.push(new PerspectivePlugin({build_worker: build_worker}));
    return {
        mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG || no_minify ? "development" : process.env.NODE_ENV || "production",
        plugins: plugins,
        devtool: "source-map",
        node: {
            fs: "empty"
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        output: {
                            ascii_only: true
                        },
                        keep_infinity: true
                    },
                    cache: true,
                    parallel: true,
                    test: /\.js(\?.*)?$/i,
                    exclude: /(node|wasm|asmjs)/,
                    sourceMap: true
                })
            ]
        }
    };
};
