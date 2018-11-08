const path = require('path');
const common = require('../../src/config/common.config.js');

module.exports = Object.assign({}, common({no_minify: true}), {
    entry: './bench/js/benchmark.js',
    target: "node",
    externals: [/^([a-z0-9]|\@(?!apache\-arrow)).*?(?!wasm)$/g],
    node: {
        __dirname: false,
        __filename: false
    },
    output: {
        filename: 'benchmark.js',
        path: path.resolve(__dirname, '../../build'),
        libraryTarget: "umd"
    }
});

