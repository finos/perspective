const cpy = require("cpy");
const { WorkerPlugin } = require("@finos/perspective-esbuild-plugin/worker");
const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const { UMDLoader } = require("@finos/perspective-esbuild-plugin/umd");
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
        globalName: "perspective",
        footer: { js: "window.perspective=perspective;" },
        format: "cjs",
        entryPoints: ["src/js/perspective.browser.js"],
        plugins: [
            PerspectiveEsbuildPlugin({
                wasm: { inline: true },
                worker: { inline: true },
            }),
            UMDLoader(),
        ],
        outfile: "dist/umd/perspective.js",
    },
];

async function build_all() {
    await cpy(["../../cpp/perspective/dist/esm"], "dist/pkg/esm");
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
