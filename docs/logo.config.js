const path = require("path");
const common = require("@finos/perspective/src/config/common.config.js");

module.exports = common({}, config => {
    Object.assign(config, {
        entry: "./logo.js",
        output: {
            filename: "logo.js",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "static/js")
        }
    });
    return config;
});
