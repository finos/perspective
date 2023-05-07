const cpy_mod = import("cpy");
const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const { build } = require("@finos/perspective-esbuild-plugin/build");
const {
    PerspectiveEsbuildPlugin,
} = require("@finos/perspective-esbuild-plugin");

const BUILD = [
    {
        define: {
            global: "window",
        },
        format: "esm",
        entryPoints: ["src/js/perspective.browser.js"],
        plugins: [NodeModulesExternal()],
        external: ["*.wasm", "*.worker.js"],
        outfile: "dist/esm/perspective.js",
    },
    {
        entryPoints: ["src/js/perspective.node.js"],
        platform: "node",
        plugins: [
            PerspectiveEsbuildPlugin({ wasm: { inline: true } }),
            NodeModulesExternal(),
        ],
        outfile: "dist/cjs/perspective.node.js",
    },
    {
        define: {
            global: "window",
        },
        format: "esm",
        entryPoints: ["src/js/perspective.browser.js"],
        plugins: [PerspectiveEsbuildPlugin()],
        outfile: "dist/cdn/perspective.js",
    },
    {
        define: {
            global: "window",
        },
        format: "esm",
        entryPoints: ["src/js/perspective.browser.js"],
        plugins: [
            PerspectiveEsbuildPlugin({
                wasm: { inline: true },
                worker: { inline: true },
            }),
        ],
        outfile: "dist/esm/perspective.inline.js",
    },
];

async function build_all() {
    const { default: cpy } = await cpy_mod;
    await cpy(["../../cpp/perspective/dist/web/*"], "dist/pkg/web");
    await cpy(["../../cpp/perspective/dist/node/*"], "dist/pkg/node");
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
