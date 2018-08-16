const path = require('path');
const common = require('../../src/config/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './bench/js/benchmark.js',
    plugins: [],
    target: "node",
    externals: [/^([a-z0-9]|\@(?!apache\-arrow)).*$/],
    node: {},
    output: {
        filename: 'benchmark.js',
        path: path.resolve(__dirname, '../../build'),
        libraryTarget: "umd"
    }
});

module.exports.module.rules.push({
    test: /\.wasm$/,
    loader: "arraybuffer-loader"
});