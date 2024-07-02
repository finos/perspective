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

exports.WasmPlugin = function WasmPlugin(inline) {
    function setup(build) {
        build.onResolve({ filter: /\.wasm$/ }, (args) => {
            if (
                args.namespace === "wasm-stub" ||
                args.namespace === "wasm-inline"
            ) {
                const entryPoint = path.join(
                    args.pluginData.resolveDir,
                    args.path
                );

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

        build.onLoad(
            { filter: /.*/, namespace: "wasm-stub" },
            async (args) => ({
                pluginData: args.pluginData,
                contents: `
                import wasm from ${JSON.stringify(args.path)};
                export default function() { 
                    return fetch(new URL(__PSP_INLINE_WASM__(wasm), import.meta.url));
                };
            `,
            })
        );

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
            for (const file of Object.keys(metafile.outputs)) {
                if (file.endsWith(".js")) {
                    let contents = fs.readFileSync(file).toString();
                    const symbol = contents.match(
                        /__PSP_INLINE_WASM__\(([a-zA-Z0-9_]+?)\)/
                    );

                    if (symbol?.[1]) {
                        const filename = contents.match(
                            new RegExp(`${symbol[1]}\\s*?=\\s*?\\"(.+?)\\"`)
                        );

                        contents = contents.replace(
                            /__PSP_INLINE_WASM__\([a-zA-Z0-9_]+?\)/g,
                            `"${filename[1]}"`
                        );

                        fs.writeFileSync(file, contents);
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
