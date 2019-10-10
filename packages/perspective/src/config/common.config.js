const webpack = require("webpack");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const plugins = [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)];

module.exports = function({build_worker, no_minify} = {}) {
    plugins.push(new PerspectivePlugin({build_worker: build_worker}));
    return {
        mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG || no_minify ? "development" : process.env.NODE_ENV || "production",
        plugins: plugins,
        module: {
            rules: [
                {
                    test: /\.less$/,
                    exclude: /node_modules/,
                    use: [{loader: "css-loader"}, {loader: "clean-css-loader", options: {level: 2}}, {loader: "less-loader"}]
                },
                {
                    test: /\.(html)$/,
                    use: {
                        loader: "html-loader",
                        options: {}
                    }
                },
                {
                    test: /\.(arrow)$/,
                    use: {
                        loader: "arraybuffer-loader",
                        options: {}
                    }
                },
                // FIXME Workaround for performance regression in @apache-arrow 4.0
                {
                    test: /\.js$/,
                    include: /\@apache-arrow[/\\]es5-esm/,
                    use: [
                        {loader: "source-map-loader"},
                        {
                            loader: "string-replace-loader",
                            options: {
                                search: "BaseVector.prototype[Symbol.isConcatSpreadable] = true;",
                                replace: ""
                            }
                        }
                    ]
                }
            ]
        },
        devtool: "source-map",
        node: {
            fs: "empty"
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
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
