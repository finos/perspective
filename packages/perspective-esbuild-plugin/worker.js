const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const {EmptyPlugin} = require("./empty.js");

exports.WorkerPlugin = function WorkerPlugin(options = {}) {
    const inline = !!options.inline;
    const targetdir = options.targetdir || "build/worker";
    function setup(build) {
        build.onResolve(
            {filter: /^(monaco-editor|\@finos\/perspective).+?worker\.js$/},
            (args) => {
                if (args.namespace === "worker-stub") {
                    const outfile = `${targetdir}/` + path.basename(args.path);
                    const subbuild = esbuild.build({
                        target: ["es2021"],
                        entryPoints: [require.resolve(args.path)],
                        outfile,
                        define: {
                            global: "self",
                        },
                        plugins: [EmptyPlugin(["fs", "path"])],
                        entryNames: "[name]",
                        chunkNames: "[name]",
                        assetNames: "[name]",
                        minify: !process.env.PSP_DEBUG,
                        bundle: true,
                        sourcemap: false,
                    });

                    return {
                        path: args.path,
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
                };
            }
        );

        build.onLoad({filter: /.*/, namespace: "worker-stub"}, async (args) => {
            if (inline) {
                return {
                    contents: `
                        import worker from ${JSON.stringify(args.path)};
                        function make_host(a, b) {
                            function addEventListener(type, callback) {
                                a.push(callback);
                            }

                            function postMessage(msg) {
                                if (Object.keys(msg).length > 0) {
                                    for (const listener of b) {
                                        listener({data: msg});
                                    }
                                }
                            }

                            return {
                                addEventListener,
                                postMessage,
                                location: {href: ""}
                            }
                        }

                        function run_single_threaded(code, e) {
                            console.error("Running perspective in single-threaded mode due to error initializing Web Worker:", e);
                            let f = Function("const self = arguments[0];" + code);
                            const workers = [];
                            const mains = [];
                            f(make_host(workers, mains));
                            return make_host(mains, workers);
                        }

                        export const initialize = async function () {
                            if (window.location.protocol.startsWith("file")) {
                                return run_single_threaded(worker, "file:// protocol does not support Web Workers");
                            }

                            try {
                                const blob = new Blob([worker], {type: 'application/javascript'});
                                const url = URL.createObjectURL(blob);
                                return new Worker(url, {type: "module"});
                            } catch (e) {
                                return run_single_threaded(worker, e);
                            }
                        };

                        export default initialize;
                    `,
                };
            }

            return {
                contents: `
                    import worker from ${JSON.stringify(args.path)};
                    async function get_worker_code() {
                        const url = new URL(worker, import.meta.url);
                        const req = await fetch(url);
                        const code = await req.text();
                        return code;
                    };

                    function make_host(a, b) {
                        function addEventListener(type, callback) {
                            a.push(callback);
                        }

                        function postMessage(msg) {
                            if (Object.keys(msg).length > 0) {
                                for (const listener of b) {
                                    listener({data: msg});
                                }
                            }
                        }

                        return {
                            addEventListener,
                            postMessage,
                            location: {href: ""}
                        }
                    }

                    function run_single_threaded(code) {
                        let f = Function("const self = arguments[0];" + code);
                        const workers = [];
                        const mains = [];
                        f(make_host(workers, mains));
                        return make_host(mains, workers);
                    }

                    const code_promise = get_worker_code();
                    export const initialize = async function () {
                        const code = await code_promise;
                        if (window.location.protocol.startsWith("file") && !window.isElectron) {
                            console.warn("file:// protocol does not support Web Workers");
                            return run_single_threaded(code);
                        }

                        try {
                            const blob = new Blob([code], {type: 'application/javascript'});
                            const url = URL.createObjectURL(blob);
                            return new Worker(url, {type: "module"});
                        } catch (e) {
                            console.warn("Failed to instantiate worker, falling back to single-threaded runtime", e);
                            return run_single_threaded(code);
                        }
                    };

                    export default initialize;
                `,
            };
        });

        build.onLoad({filter: /.*/, namespace: "worker"}, async (args) => {
            // Get the subbuild output and delete the temp file
            await args.pluginData.subbuild;
            contents = await fs.promises.readFile(args.pluginData.outfile);

            // // Copy the sourcemaps also
            // const mapfile = args.pluginData.outfile + ".map";
            // sourcemap = await fs.promises.readFile(mapfile);

            const outpath =
                build.initialOptions.outdir ||
                path.dirname(build.initialOptions.outfile);

            if (!fs.existsSync(outpath)) {
                fs.mkdirSync(outpath, {recursive: true});
            }

            // await fs.promises.writeFile(
            //     path.join(outpath, path.basename(args.path) + ".map"),
            //     sourcemap
            // );

            return {
                contents,
                loader: inline ? "text" : "file",
            };
        });
    }

    return {
        name: "webworker",
        setup,
    };
};
