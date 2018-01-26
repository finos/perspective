const path = require('path');
const common = require('@jpmorganchase/perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './src/js/perspective.parallel.js',
    output: {
        filename: 'perspective.js',
        library: "perspective",
        libraryTarget: "umd",
        path: path.resolve(__dirname, '../../build')
    }
});