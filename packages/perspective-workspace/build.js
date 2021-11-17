const {lessLoader} = require("esbuild-plugin-less");
const {execSync} = require("child_process");

const {InlineCSSPlugin} = require("@finos/perspective-build/inline_css");
const {NodeModulesExternal} = require("@finos/perspective-build/external");
const {IgnoreCSSPlugin} = require("@finos/perspective-build/ignore_css");
const {IgnoreFontsPlugin} = require("@finos/perspective-build/ignore_fonts");
const {WasmPlugin} = require("@finos/perspective-build/wasm");
const {WorkerPlugin} = require("@finos/perspective-build/worker");
const {build} = require("@finos/perspective-build/build");

const BUILD = [
    {
        entryPoints: [
            "src/themes/material.less",
            "src/themes/material.dark.less",
        ],
        plugins: [lessLoader()],
        outdir: "dist/css",
    },
    {
        entryPoints: ["src/js/perspective-workspace.js"],
        define: {
            global: "window",
        },
        format: "esm",
        plugins: [
            InlineCSSPlugin(),
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            WorkerPlugin(false),
            NodeModulesExternal(),
        ],
        loader: {
            ".html": "text",
        },
        external: ["*.wasm"],
        outfile: "dist/esm/perspective-workspace.js",
    },
    {
        entryPoints: ["src/js/perspective-workspace.js"],
        define: {
            global: "window",
        },
        plugins: [
            InlineCSSPlugin(),
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            WasmPlugin(true),
            WorkerPlugin(true),
        ],
        format: "iife",
        loader: {
            ".html": "text",
        },
        outfile: "dist/umd/perspective-workspace.js",
    },
    {
        entryPoints: ["src/js/perspective-workspace.js"],
        define: {
            global: "window",
        },
        plugins: [
            InlineCSSPlugin(),
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            WasmPlugin(false),
            WorkerPlugin(false),
        ],
        format: "esm",
        splitting: true,
        loader: {
            ".html": "text",
        },
        outdir: "dist/cdn",
    },
];

async function build_all() {
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    execSync("cpy dist/css/* dist/umd");
}

build_all();
