const TerserPlugin = require("terser-webpack-plugin");

module.exports.minimizer = [
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
];
