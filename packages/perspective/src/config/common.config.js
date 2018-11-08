const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const webpack = require("webpack");
const PerspectivePlugin = require("../../webpack-plugin");

const plugins = [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)];

module.exports = function({build_worker, no_minify} = {}) {
    if (!process.env.PSP_NO_MINIFY && !process.env.PSP_DEBUG && !no_minify) {
        plugins.push(
            new UglifyJSPlugin({
                sourceMap: true,
                mangle: false,
                exclude: /(asmjs\.worker\.js)$/,
                output: {
                    ascii_only: true
                }
            })
        );
    }

    plugins.push(new PerspectivePlugin({build_worker: build_worker}));
    return {
        plugins: plugins,
        devtool: "source-map",
        node: {
            fs: "empty"
        }
    };
};
