const cpy = require("cpy");

const { lessLoader } = require("esbuild-plugin-less");

const { WasmPlugin } = require("@finos/perspective-esbuild-plugin/wasm");
const { WorkerPlugin } = require("@finos/perspective-esbuild-plugin/worker");
const { UMDLoader } = require("@finos/perspective-esbuild-plugin/umd");
const { build } = require("@finos/perspective-esbuild-plugin/build");

const TEST_BUILD = {
    entryPoints: ["src/js/psp_widget.js"],
    define: {
        global: "window",
    },
    plugins: [
        lessLoader(),
        WasmPlugin(true),
        WorkerPlugin({ inline: true }),
        UMDLoader(),
    ],
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
    plugins: [lessLoader(), WasmPlugin(true), WorkerPlugin({ inline: true })],
    external: ["@jupyter*", "@lumino*"],
    format: "esm",
    loader: {
        ".html": "text",
        ".ttf": "file",
    },
    outfile: "dist/umd/perspective-jupyterlab.js",
};

const BUILD = [
    process.argv.some((x) => x == "--test") ? TEST_BUILD : PROD_BUILD,
];

async function build_all() {
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    cpy(["dist/css/*"], "dist/umd");
    cpy(["src/less/*"], "dist/less");
}

build_all();
