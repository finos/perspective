const path = require('path');
const common = require('@jpmorganchase/perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
	plugins: [],
    entry: './test/js/benchmark.js',
    output: {
        filename: 'benchmark.js',
        path: path.resolve(__dirname, '../../build')
    }
});