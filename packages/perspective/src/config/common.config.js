const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const webpack = require("webpack");
const PerspectivePlugin = require("@jpmorganchase/perspective-webpack-plugin");


module.exports = function({build_worker, no_minify} = {}) {
    const plugins = [
        new PerspectivePlugin({
            build_worker
        }),
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)
    ];

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

    return {
        module: {
            rules: [
                {
                    test: /\.less$/,
                    exclude: /themes/,
                    use: [
                        {
                            loader: "css-loader"
                        }, 
                        {
                            loader: "clean-css-loader", 
                            options: {
                                level: 2
                            }
                        }, 
                        {
                            loader: "less-loader"
                        }
                    ]
                },
                {
                    test: /\.(html)$/,
                    loader: "html-loader"
                },
                {
                    test: /\.(arrow)$/,
                    loader: "arraybuffer-loader"
                },
                {	
                    test: /\.js$/,	
                    exclude: /node_modules[/\\](?!\@jpmorganchase)|psp\.(asmjs|async|sync)\.js|perspective\.(asmjs|wasm)\.worker\.js/,	
                    loader: "babel-loader",	
                    options: require(path.join(__dirname, "..", "..", ".babelrc"))	
                }
            ]
        },
        plugins,
        devtool: "source-map",
        node: {
            fs: "empty"
        }
    };
};
