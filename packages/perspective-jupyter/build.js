const cpy = require("cpy");

const {lessLoader} = require("esbuild-plugin-less");

const {WasmPlugin} = require("@finos/perspective-build/wasm");
const {WorkerPlugin} = require("@finos/perspective-build/worker");
const {UMDLoader} = require("@finos/perspective-build/umd");
const {build} = require("@finos/perspective-build/build");

const TEST_BUILD = {
    entryPoints: ["src/js/plugin/psp_widget.js"],
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
    entryPoints: ["src/js/plugin/index.js"],
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
    outfile: "dist/umd/perspective-jupyter.js",
};

const BUILD = [
    process.argv.some((x) => x == "--test") ? TEST_BUILD : PROD_BUILD,
];

async function build_all() {
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    cpy(["src/less/*"], "dist/less");
}

build_all();
