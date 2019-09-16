const path = require("path");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    entry: './src/server.js',
    target: "node",
    mode: 'development',
    node: {
        __dirname: false,
        __filename: false
    },
    output: {
        path: __dirname + '/perspective/node/assets',
        libraryTarget: "umd",
        filename: 'bundle.js'
    },
    externals: [/@finos/],
    plugins: [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/), new PerspectivePlugin()],
    module: {
        rules: [
            {test: /\.node$/,
             include: /node_modules/,
             use: [{loader: 'native-ext-loader',
                    options: {
                        name: 'libs/[hash].[ext]',
                        rewritePath: './perspective/node/assets',
                    }
                }],
           }
        ]
    }
};
