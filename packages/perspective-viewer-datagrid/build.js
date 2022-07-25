const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const {
    InlineCSSPlugin,
} = require("@finos/perspective-esbuild-plugin/inline_css");
const {UMDLoader} = require("@finos/perspective-esbuild-plugin/umd");
const {build} = require("@finos/perspective-esbuild-plugin/build");

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
        globalName: "perspective_datagrid",
        plugins: [InlineCSSPlugin(), UMDLoader()],
        format: "cjs",
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
