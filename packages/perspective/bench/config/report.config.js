const path = require('path');
const common = require('../../src/config/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './bench/js/report.js',
    output: {
        filename: 'report.js',
        path: path.resolve(__dirname, '../../build')
    }
});