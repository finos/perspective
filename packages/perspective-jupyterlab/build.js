const cpy = require("cpy");

const {lessLoader} = require("esbuild-plugin-less");

const {WasmPlugin} = require("@finos/perspective-build/wasm");
const {WorkerPlugin} = require("@finos/perspective-build/worker");
const {UMDLoader} = require("@finos/perspective-build/umd");
const {build} = require("@finos/perspective-build/build");

const TEST_BUILD = {
    entryPoints: ["src/js/psp_widget.js"],
    define: {
        global: "window",
    },
    plugins: [lessLoader(), WasmPlugin(true), WorkerPlugin(true), UMDLoader()],
    globalName: "PerspectiveLumino",
    format: "cjs",
    loader: {
        ".html": "text",
        ".ttf": "file",
    },
    outfile: "dist/umd/lumino.js",
};

const PROD_BUILD = {
    entryPoints: ["src/js/index.js"],
    define: {
        global: "window",
    },
    plugins: [lessLoader(), WasmPlugin(true), WorkerPlugin(true)],
    external: ["@jupyter*", "@lumino*"],
    format: "esm",
    loader: {
        ".html": "text",
        ".ttf": "file",
    },
    outfile: "dist/umd/perspective-jupyterlab.js",
};

const NBEXTENSION_BUILD = {
    entryPoints: ["src/js/nbextension.js"],
    define: {
        global: "window",
    },
    format: 'esm',
    plugins: [lessLoader(), WasmPlugin(true), WorkerPlugin(true)],
    // external: ["@jupyter*", "@lumino*", "@jupyter-widgets*"],
    external: ["@jupyter-widgets*"],
    loader: {
        ".html": "text",
        ".ttf": "file",
    },
    outfile: "dist/umd/perspective-nbextension.js",
};

const BUILD = [
    process.argv.some((x) => x == "--test") ? TEST_BUILD : PROD_BUILD,
    NBEXTENSION_BUILD,
];

async function build_all() {
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    cpy(["dist/css/*"], "dist/umd");
    // cpy(["dist/umd/*"], "../../python/perspective/jupyter/src/build");
    // cpy(["dist/umd/*"], "../../python/perspective/jupyter/lib/build");
}

build_all();
