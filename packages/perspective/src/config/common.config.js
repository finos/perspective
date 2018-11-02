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
                          use: {loader: path.resolve(__dirname, "../loader/blob_worker_loader.js"), options: {name: "[name].worker.js"}}
                      }
                    : {
                          test: /perspective\.(asmjs|wasm)\.js$/,
                          use: {loader: path.resolve(__dirname, "../loader/file_worker_loader.js"), options: {name: "[name].js"}}
                      },
                {
                    test: /\.wasm$/,
                    use: {loader: path.resolve(__dirname, "../loader/cross_origin_file_loader.js"), options: {name: "[name].wasm"}}
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules\/(?!(\@apache|\@jupyterlab))|psp\.(asmjs|async|sync).js/,
                    loader: "babel-loader",
                    options: {
                        presets: [["env", {useBuiltIns: true}]],
                        plugins: ["transform-decorators-legacy", "transform-custom-element-classes", "transform-runtime", "transform-object-rest-spread", ["transform-es2015-for-of", {loose: true}]]
                    }
                }
            ]
        }
    };
};
