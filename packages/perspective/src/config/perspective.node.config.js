const path = require('path');
const common = require('perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './src/js/perspective.node.js',
    plugins: [],
    target: "node",
    node: {},
    output: {
        filename: 'perspective.node.js',
        path: path.resolve(__dirname, '../../build'),
        libraryTarget: "commonjs-module"
    }
});