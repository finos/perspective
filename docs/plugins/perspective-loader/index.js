const PerspectiveWebpackPlugin = require("@finos/perspective-webpack-plugin");

module.exports = function (context, options) {
    return {
        name: "perspective",
        configureWebpack(config, isServer) {
            config.module.rules.map((x) => {
                if (x.test.toString() === "/\\.css$/i") {
                    x.exclude = [/\.module\.css$/i, /@finos/i, /monaco/i];
                }
            });

            config.module.rules.push({
                test: /arrow$/i,
                type: "asset/resource",
            });

            return {
                node: {
                    __filename: false,
                },
                plugins: [new PerspectiveWebpackPlugin({})],
            };
        },
    };
};
