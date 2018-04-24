const path = require('path');
const common = require('../../src/config/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './test/js/perspective.spec.js',
    target: "node",
    plugins: [],
    node: {},
    output: {
        filename: 'perspective.spec.js',
        path: path.resolve(__dirname, '../../build')
    }
});