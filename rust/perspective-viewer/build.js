const {lessLoader} = require("esbuild-plugin-less");
const execSync = require("child_process").execSync;
const esbuild = require("esbuild");

const {IgnoreCSSPlugin} = require("@finos/perspective-build/ignore_css");
const {IgnoreFontsPlugin} = require("@finos/perspective-build/ignore_fonts");
const {WasmPlugin} = require("@finos/perspective-build/wasm");
const {WorkerPlugin} = require("@finos/perspective-build/worker");
const {NodeModulesExternal} = require("@finos/perspective-build/external");
const {ReplacePlugin} = require("@finos/perspective-build/replace");
const {build} = require("@finos/perspective-build/build");

const PREBUILD = [
    {
        entryPoints: [
            "viewer",
            "column-style",
            "filter-dropdown",
            "expression-editor",
        ].map((x) => `src/less/${x}.less`),
        metafile: false,
        sourcemap: false,
        plugins: [IgnoreFontsPlugin(), WasmPlugin(true), lessLoader()],
        outdir: "build/css",
    },
];

const BUILD = [
    {
        entryPoints: [
            "src/themes/material-dense.less",
            "src/themes/material-dense.dark.less",
        ],
        plugins: [WasmPlugin(false), lessLoader()],
        outdir: "dist/css",
    },
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        format: "esm",
        plugins: [
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            NodeModulesExternal(),

            // Rust outputs a `URL()` when an explicit path for the wasm
            // is not specified.  Esbuild ignores this, but webpack does not,
            // and we always call this method with an explicit path, so this
            // plugin strips this URL so webpack builds don't fail.
            ReplacePlugin(/["']perspective_viewer_bg\.wasm["']/, "undefined"),
        ],
        // splitting: true,
        external: ["*.wasm", "*.worker.js"],
        outdir: "dist/esm",
    },
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        // metafile: false,
        plugins: [
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            WasmPlugin(true),
            WorkerPlugin(true),
        ],
        outfile: "dist/umd/perspective-viewer.js",
    },
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        format: "esm",
        metafile: false,
        plugins: [
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            WasmPlugin(false),
            WorkerPlugin(false),
        ],
        splitting: true,
        outdir: "dist/cdn",
    },
];

async function build_all() {
    await Promise.all(PREBUILD.map(build)).catch(() => process.exit(1));

    const debug = process.env.PSP_DEBUG ? "--debug" : "";
    execSync(
        `CARGO_TARGET_DIR=./build wasm-pack build ${debug} --out-dir dist/pkg --target web`,
        {
            stdio: "inherit",
            stderr: "inherit",
        }
    );

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));

    // legacy compat
    execSync("cpy dist/css/* dist/umd");
}

build_all();
