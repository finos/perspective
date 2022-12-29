const { lessLoader } = require("esbuild-plugin-less");
const { execSync } = require("child_process");

const {
    InlineCSSPlugin,
} = require("@finos/perspective-esbuild-plugin/inline_css");
const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const {
    IgnoreCSSPlugin,
} = require("@finos/perspective-esbuild-plugin/ignore_css");
const { WasmPlugin } = require("@finos/perspective-esbuild-plugin/wasm");
const { WorkerPlugin } = require("@finos/perspective-esbuild-plugin/worker");
const { ResolvePlugin } = require("@finos/perspective-esbuild-plugin/resolve");
const { build } = require("@finos/perspective-esbuild-plugin/build");

const BUILD = [
    {
        entryPoints: [
            "src/themes/material.less",
            "src/themes/material-dark.less",
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

            // Inlining `lumino` and importing the `.ts` source saves _50kb_
            NodeModulesExternal("@lumino"),
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
            WasmPlugin(true),
            WorkerPlugin({ inline: true }),
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
            ResolvePlugin({
                "@finos/perspective":
                    "@finos/perspective/dist/esm/perspective.js",
                "@finos/perspective-viewer":
                    "@finos/perspective-viewer/dist/esm/perspective-viewer.js",
            }),
            InlineCSSPlugin(),
            IgnoreCSSPlugin(),
            WasmPlugin(false),
            WorkerPlugin({ inline: false }),
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
