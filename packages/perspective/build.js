const fs = require("fs");
const cpy = require("cpy");
const esbuild = require("esbuild");
const {WasmPlugin} = require("@finos/perspective-build/wasm");
const {WorkerPlugin} = require("@finos/perspective-build/worker");
const {NodeModulesExternal} = require("@finos/perspective-build/external");
const {UMDLoader} = require("@finos/perspective-build/umd");
const {build} = require("@finos/perspective-build/build");

const BUILD = [
    {
        define: {
            global: "window",
        },
        format: "esm",
        entryPoints: ["src/js/perspective.parallel.js"],
        plugins: [NodeModulesExternal()],
        external: ["*.wasm", "*.worker.js"],
        outfile: "dist/esm/perspective.js",
    },
    {
        entryPoints: ["src/js/perspective.node.js"],
        platform: "node",
        plugins: [WasmPlugin(true), NodeModulesExternal()],
        outfile: "dist/cjs/perspective.node.js",
    },
    {
        define: {
            global: "window",
        },
        format: "esm",
        entryPoints: ["src/js/perspective.parallel.js"],
        plugins: [WasmPlugin(false), WorkerPlugin(false)],
        outfile: "dist/cdn/perspective.js",
    },
    {
        define: {
            global: "window",
        },
        globalName: "perspective",
        footer: {js: "window.perspective=perspective;"},
        format: "cjs",
        entryPoints: ["src/js/perspective.parallel.js"],
        plugins: [WasmPlugin(true), WorkerPlugin(true), UMDLoader()],
        outfile: "dist/umd/perspective.js",
    },
];

async function build_all() {
    await cpy(["../../cpp/perspective/dist/esm"], "dist/pkg/esm");
    await cpy(["../../cpp/perspective/dist/cjs"], "dist/pkg/cjs");
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
