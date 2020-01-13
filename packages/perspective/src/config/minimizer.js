const TerserPlugin = require("terser-webpack-plugin");

module.exports.minimizer = [
    new TerserPlugin({
        cache: true,
        parallel: true,
        test: /\.js(\?.*)?$/i,
        exclude: /wasm/,
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
    })
];
