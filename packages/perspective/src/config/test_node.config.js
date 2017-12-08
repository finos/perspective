const path = require('path');
const common = require('@jpmorganchase/perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './test/js/test_node.js',
    target: "node",
    node: {},
    output: {
        filename: 'test_node.js',
        path: path.resolve(__dirname, '../../build')
    }
});