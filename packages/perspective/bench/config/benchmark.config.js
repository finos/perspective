const path = require('path');
const common = require('../../src/config/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './bench/js/benchmark.js',
    plugins: [],
    target: "node",
    output: {
        filename: 'benchmark.js',
        path: path.resolve(__dirname, '../../build')
    }
});