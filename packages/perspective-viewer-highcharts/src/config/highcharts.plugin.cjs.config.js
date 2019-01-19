const path = require("path");
const common = require("@jpmorganchase/perspective/src/config/common.config.js");
const {dependencies} = require("../../package.json");

const externals = Object.keys(dependencies).map(external => new RegExp(`^${external}.*$`));

module.exports = Object.assign({}, common({no_minify: true}), {
    devtool: false,
    entry: "./src/js/highcharts.js",
    output: {
        filename: "perspective-viewer-plugin-highcharts.js",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname, "../../cjs")
    },
    externals: [
        function(context, request, callback) {
            for (let external of externals) {
                if (external.test(request)) {
                    return callback(null, "commonjs " + request);
                }
            }
            callback();
        }
    ]
});
