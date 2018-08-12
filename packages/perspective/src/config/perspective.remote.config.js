const path = require('path');
const common = require('./common.config.js');

module.exports = Object.assign({}, common(), {
    entry: './src/js/perspective.remote.js',
    output: {
        filename: 'perspective.remote.js',
        library: "perspective_remote",
        libraryTarget: "umd",
        path: path.resolve(__dirname, '../../build')
    }
});