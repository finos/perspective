const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

const plugins = [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)];

if (!process.env.PSP_NO_MINIFY && !process.env.PSP_DEBUG) {
    plugins.push(
        new UglifyJSPlugin({
            sourceMap: true,
            mangle: false,
            exclude: /asmjs\.worker\.js$/,
            output: {
                ascii_only: true
            }
        })
    );
}

module.exports = function(build_worker) {
    return {
        plugins: plugins,
        devtool: "source-map",
        node: {
            fs: "empty"
        },
        resolveLoader: {
            modules: ["node_modules", path.join(__dirname, "../loader")]
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [{loader: "css-loader"}]
                },
                {
                    test: /\.less$/,
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
                build_worker
                    ? {
                          test: /perspective\.(asmjs|wasm)\.js$/,
                          use: {loader: "blob_worker_loader", options: {name: "[name].worker.js"}}
                      }
                    : {
                          test: /perspective\.(asmjs|wasm)\.js$/,
                          use: {loader: "file_worker_loader", options: {name: "[name].js"}}
                      },
                {
                    test: /\.wasm$/,
                    use: {loader: "cross_origin_file_loader", options: {name: "[name].wasm"}}
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules\/(?!(\@apache|\@jupyterlab))|psp\.(asmjs|async|sync).js/,
                    loader: "babel-loader"
                }
            ]
        }
    };
};
