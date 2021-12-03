const fs = require("fs");

exports.WasmPlugin = function WasmPlugin(inline) {
    function setup(build) {
        build.onResolve({filter: /\.wasm$/}, (args) => {
            if (
                args.namespace === "wasm-stub" ||
                args.namespace === "wasm-inline"
            ) {
                return {
                    path: args.path,
                    namespace: "wasm",
                };
            }

            return {
                path: args.path,
                namespace: inline ? "wasm-inline" : "wasm-stub",
            };
        });

        build.onLoad(
            {filter: /.*/, namespace: "wasm-inline"},
            async (args) => ({
                contents: `
                    import wasm from ${JSON.stringify(args.path)};
                    export default Promise.resolve(wasm);
                `,
            })
        );

        build.onLoad({filter: /.*/, namespace: "wasm-stub"}, async (args) => ({
            contents: `
                import wasm from ${JSON.stringify(args.path)};
                async function get_wasm() {
                    const req = await fetch(new URL(wasm, import.meta.url));
                    const buffer = await req.arrayBuffer();
                    return buffer;
                }

                export default get_wasm();
            `,
        }));

        build.onLoad({filter: /.*/, namespace: "wasm"}, async (args) => {
            const path = require.resolve(args.path);
            const contents = await fs.promises.readFile(path);
            return {
                contents,
                loader: inline ? "binary" : "file",
            };
        });
    }

    return {
        name: "wasm",
        setup,
    };
};
