const path = require("path");
const common = require("./common.config.js");

module.exports = common({inline: true}, config =>
    Object.assign(config, {
        entry: "./dist/esm/perspective.parallel.js",
        devtool: undefined,
        output: {
            filename: "perspective.inline.js",
            library: "perspective",
            libraryTarget: "umd",
            libraryExport: "default",
            chunkFilename: "perspective.inline.chunk_[id].js",
            path: path.resolve(__dirname, "../../dist/umd")
        }
    })
);
