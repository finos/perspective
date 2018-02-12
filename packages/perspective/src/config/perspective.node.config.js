const path = require('path');
const common = require('@jpmorganchase/perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './src/js/perspective.node.js',
    target: "node",
    plugins: [],
    node: {},
    output: {
        filename: 'perspective.node.js',
        path: path.resolve(__dirname, '../../build'),
        libraryTarget: "commonjs-module"
    }
});