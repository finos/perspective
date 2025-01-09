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

const fs = require("fs");
const path = require("path");

exports.WasmPlugin = function WasmPlugin(inline, webpack_hack) {
    function setup(build) {
        const options = build.initialOptions;
        options.metafile = true;
        const KEYSET = [];

        build.onResolve({ filter: /\.wasm$/ }, (args) => {
            if (
                args.namespace === "wasm-stub" ||
                args.namespace === "wasm-inline"
            ) {
                let entryPoint = args.path;
                if (args.path.startsWith(".")) {
                    entryPoint = path.join(
                        args.pluginData.resolveDir,
                        entryPoint
                    );
                }

                return {
                    path: entryPoint,
                    namespace: "wasm",
                };
            }

            return {
                path: args.path,
                namespace: inline ? "wasm-inline" : "wasm-stub",
                pluginData: {
                    resolveDir: args.resolveDir,
                },
            };
        });

        build.onLoad(
            { filter: /.*/, namespace: "wasm-inline" },
            async (args) => ({
                pluginData: args.pluginData,
                contents: `
                    import wasm from ${JSON.stringify(args.path)};
                    export default function() { 
                        return Promise.resolve(wasm.buffer); 
                    };
                `,
            })
        );

        build.onLoad({ filter: /.*/, namespace: "wasm-stub" }, async (args) => {
            const key = `__PSP_INLINE_WASM__${Math.random()
                .toString()
                .slice(2)}__`;
            KEYSET.push(key);
            const url = webpack_hack ? `${key}(wasm)` : `wasm`;

            return {
                pluginData: args.pluginData,
                contents: `
                import wasm from ${JSON.stringify(args.path)};
                export default function() { 
                    return fetch(new URL(${url}, import.meta.url));
                };
            `,
            };
        });

        build.onLoad({ filter: /.*/, namespace: "wasm" }, async (args) => {
            const path = require.resolve(args.path);
            const contents = await fs.promises.readFile(path);
            return {
                pluginData: args.pluginData,
                contents,
                loader: inline ? "binary" : "file",
            };
        });

        build.onEnd(({ metafile }) => {
            if (webpack_hack) {
                for (const file of Object.keys(metafile.outputs)) {
                    if (file.endsWith(".js")) {
                        let contents = fs.readFileSync(file).toString();
                        let updated = false;
                        for (const key of KEYSET) {
                            const symbol = contents.match(
                                new RegExp(`${key}\\(([a-zA-Z0-9_\$]+?)\\)`)
                            );

                            if (symbol?.[1]) {
                                updated = true;
                                const escapedSymbol = symbol[1].replace(
                                    /\$/g,
                                    "\\$"
                                );

                                const filename = contents.match(
                                    new RegExp(
                                        `(?<![a-zA-Z0-9_\$])${escapedSymbol}\\s*?=\\s*?\\"(.+?)\\"`
                                    )
                                );

                                contents = contents.replace(
                                    new RegExp(
                                        `${key}\\(([a-zA-Z0-9_\$]+?)\\)`,
                                        "g"
                                    ),
                                    `"${filename[1]}"`
                                );
                            }
                        }

                        if (updated) {
                            fs.writeFileSync(file, contents);
                        }
                    }
                }
            }
        });
    }

    return {
        name: "wasm",
        setup,
    };
};
