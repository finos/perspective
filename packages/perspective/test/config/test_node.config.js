const path = require('path');
const common = require('@jpmorganchase/perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './test/js/perspective.spec.js',
    target: "node",
    node: {},
    output: {
        filename: 'perspective.spec.js',
        path: path.resolve(__dirname, '../../build')
    }
});