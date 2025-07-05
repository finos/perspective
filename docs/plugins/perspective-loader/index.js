// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const webpack = require("webpack");

module.exports = function (context, options) {
    return {
        name: "perspective",
        configureWebpack(config, isServer) {
            if (config.optimization.minimizer) {
                config.optimization.minimizer[0].options.minimizer.options.module = true;
            }

            config.experiments = config.experiments || {
                asyncWebAssembly: false,
                syncWebAssembly: false
            };

            config.experiments.topLevelAwait = true;
            config.module.rules.map((x) => {
                if (x.test.toString() === "/\\.css$/i") {
                    x.exclude = [/\.module\.css$/i, /@finos/i];
                }
            });

            config.module.rules.push({
                test: /arrow$/i,
                type: "asset/resource",
            });

            config.module.rules.push({
                test: /\.wasm$/,
                type: "asset/resource"
            });

            return {
                node: {
                    __filename: false,
                },
                plugins: isServer
                    ? [
                        new webpack.NormalModuleReplacementPlugin(
                            /@finos\/perspective/,
                            "@finos/perspective/dist/esm/perspective.js"
                        ),
                    ]
                    : [],
            };
        },
    };
};
