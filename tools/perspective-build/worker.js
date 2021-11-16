const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const esbuild = require("esbuild");

exports.WorkerPlugin = function WorkerPlugin(inline) {
    function setup(build) {
        build.onResolve({filter: /worker.js$/}, (args) => {
            if (args.namespace === "worker-stub") {
                const outfile =
                    `dist/umd/` + crypto.randomBytes(4).readUInt32LE(0);

                const subbuild = esbuild.build({
                    entryPoints: [require.resolve(args.path)],
                    outfile,
                    define: {
                        global: "self",
                    },
                    entryNames: "[name]",
                    chunkNames: "[name]",
                    assetNames: "[name]",
                    minify: !process.env.PSP_DEBUG,
                    bundle: true,
                });

                return {
                    path: args.path,
                    namespace: "worker",
                    // external: true,
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
        });

        build.onLoad({filter: /.*/, namespace: "worker-stub"}, async (args) => {
            if (inline) {
                return {
                    contents: `
                        import worker from ${JSON.stringify(args.path)};
                        export default function () {
                            const blob = new Blob([worker], {type: 'application/javascript'});
                            const url = URL.createObjectURL(blob);
                            return new Worker(url, {type: "module"});
                        }
                    `,
                };
            }

            return {
                contents: `
                    import worker from ${JSON.stringify(args.path)};
                    export default function () {
                        const url = new URL(worker, import.meta.url);
                        return new Worker(url, {type: "module"});
                    }
                `,
            };
        });

        build.onLoad({filter: /.*/, namespace: "worker"}, async (args) => {
            await args.pluginData.subbuild;
            contents = await fs.promises.readFile(args.pluginData.outfile);
            await fs.promises.unlink(args.pluginData.outfile);
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
