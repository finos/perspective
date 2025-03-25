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
const esbuild = require("esbuild");

exports.WorkerPlugin = function WorkerPlugin(options = {}) {
    const targetdir = options.targetdir || "build/worker";
    function setup(build) {
        const options = build.initialOptions;
        options.metafile = true;
        build.onResolve({ filter: /\.worker(\.js)?$/ }, (args) => {
            if (args.namespace === "worker-stub") {
                const outfile =
                    `${targetdir}/` +
                    path.basename(args.path).replace(".worker", "");

                const entryPoint = path.join(
                    args.pluginData.resolveDir,
                    args.path
                );

                const subbuild = esbuild.build({
                    target: ["es2021"],
                    entryPoints: [entryPoint],
                    // outfile,
                    define: {
                        global: "self",
                    },
                    entryNames: "[name]",
                    chunkNames: "[name]",
                    assetNames: "[name]",
                    minify: true,
                    bundle: true,
                    sourcemap: false,
                    write: false,
                });

                return {
                    path: args.path.replace(".worker", ""),
                    namespace: "worker",
                    pluginData: {
                        outfile,
                        subbuild,
                    },
                };
            }

            return {
                path: args.path,
                namespace: "worker-stub",
                pluginData: {
                    resolveDir: args.resolveDir,
                },
            };
        });

        build.onLoad(
            { filter: /.*/, namespace: "worker-stub" },
            async (args) => {
                return {
                    pluginData: args.pluginData,
                    contents: `
                        import worker from ${JSON.stringify(args.path)};
                        function make_host(a, b) {
                            function addEventListener(type, callback) {
                                if (type === "message") {
                                    a.push(callback);
                                }
                            }

                            function removeEventListener(callback) {
                                const idx = a.indexOf(callback);
                                if (idx > -1) {
                                    a.splice(idx, 1);
                                }
                            }

                            function postMessage(msg, ports) {
                                for (const listener of b) {
                                    listener({data: msg, ports: ports});
                                }
                            }

                            return {
                                addEventListener,
                                removeEventListener,
                                postMessage,
                                location: {href: ""}
                            }
                        }

                        function run_single_threaded(code) {
                            console.error("Running perspective in single-threaded mode");
                            let f = Function("const self = arguments[0];" + code);
                            const workers = [];
                            const mains = [];
                            f(make_host(workers, mains));
                            return make_host(mains, workers);
                        }

                        export const initialize = async function () {
                            try {
                                if (window.location.protocol.startsWith("file")) {
                                    console.warn("file:// protocol does not support Web Workers");
                                    return run_single_threaded(worker);
                                } else {
                                    const blob = new Blob([worker], {type: 'application/javascript'});
                                    const url = URL.createObjectURL(blob);
                                    return new Worker(url, {type: "module"});
                                }
                            } catch (e) {
                                console.error("Error instantiating engine", e);
                            }
                        };

                        export default initialize;
                    `,
                };
            }
        );

        build.onLoad({ filter: /.*/, namespace: "worker" }, async (args) => {
            // Get the subbuild output and delete the temp file
            const result = await args.pluginData.subbuild;
            const contents = result.outputFiles[0].contents;
            // // Copy the sourcemaps also
            // const mapfile = args.pluginData.outfile + ".map";
            // sourcemap = await fs.promises.readFile(mapfile);

            const outpath =
                build.initialOptions.outdir ||
                path.dirname(build.initialOptions.outfile);

            if (!fs.existsSync(outpath)) {
                fs.mkdirSync(outpath, { recursive: true });
            }

            // await fs.promises.writeFile(
            //     path.join(outpath, path.basename(args.path) + ".map"),
            //     sourcemap
            // );

            return {
                contents,
                loader: "text",
            };
        });
    }

    return {
        name: "webworker",
        setup,
    };
};
