const path = require('path');
const common = require('@jpmorganchase/perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './test/js/test_browser.js',
    output: {
        filename: 'test_browser.js',
        path: path.resolve(__dirname, '../../build')
    }
});