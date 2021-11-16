const esbuild = require("esbuild");
const {NodeModulesExternal} = require("@finos/perspective-build/external");
const {InlineCSSPlugin} = require("@finos/perspective-build/inline_css");
const {build} = require("@finos/perspective-build/build");

const BUILD = [
    {
        define: {
            global: "window",
        },
        entryPoints: ["src/js/plugin.js"],
        plugins: [InlineCSSPlugin(), NodeModulesExternal()],
        format: "esm",
        loader: {
            ".html": "text",
        },
        outfile: "dist/esm/perspective-viewer-datagrid.js",
    },
    {
        define: {
            global: "window",
        },
        entryPoints: ["src/js/plugin.js"],
        plugins: [InlineCSSPlugin()],
        format: "iife",
        loader: {
            ".html": "text",
        },
        outfile: "dist/umd/perspective-viewer-datagrid.js",
    },
    {
        define: {
            global: "window",
        },
        entryPoints: ["src/js/plugin.js"],
        plugins: [InlineCSSPlugin()],
        format: "esm",
        loader: {
            ".html": "text",
        },
        outfile: "dist/cdn/perspective-viewer-datagrid.js",
    },
];

async function build_all() {
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
