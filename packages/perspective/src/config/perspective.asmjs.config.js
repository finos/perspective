const path = require('path');
const common = require('@jpmorganchase/perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: ["babel-polyfill", './src/js/perspective.asmjs.js'],
    output: {
        filename: 'perspective.js',
        path: path.resolve(__dirname, '../../build/asmjs')
    }
});