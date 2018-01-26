
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const plugins = []

if (!process.env.PSP_NO_MINIFY) {
    plugins.push(new UglifyJSPlugin({
        sourceMap: true,
        mangle: false,
        output: {
            ascii_only: true
        }
    }));
}

module.exports = function() {
    return {
        plugins: plugins,
        devtool: 'source-map',
        node: {
            fs: "empty"
        },
        module: {
            rules: [{
                test: /\.css$/,
                use: [
                    {loader: "style-loader"},
                    {loader: "css-loader"}
                ]
            }, {
                test: /\.less$/,
                use: [
                    {loader: "style-loader"},
                    {loader: "css-loader"},
                    {loader: "less-loader"}
                ]
            }, {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {}
                }
            }, {
                test: /psp\.js$/,
                loader: "wrap-loader",
                options: {
                    before: ';var window = window || {};exports.load_perspective = function(Module) {',
                    after: ';return Module;}'
                }
            }, {
                test: /\.(arrow)$/,
                use: {
                    loader: "arraybuffer-loader",
                    options: {}
                }
            }, {
                test: /\.js$/,
                exclude: /node_modules\/(?!\@apache-arrow)|psp\.js/,
                loader: "babel-loader",
                options: {
                    presets: ['env'],
                    plugins: ['transform-runtime', ["transform-es2015-for-of", {
                        "loose": true
                    }]]
                }
            }]
        }
    };
}
