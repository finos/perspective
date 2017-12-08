const path = require('path');
const common = require('perspective-common/common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './src/js/hypergrid.js',
    output: {
        filename: 'hypergrid.plugin.js',
        library: "perspective-view-hypergrid",
        libraryTarget: "umd",
        path: path.resolve(__dirname, '../../build')
    }
});