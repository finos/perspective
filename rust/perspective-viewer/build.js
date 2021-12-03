const {lessLoader} = require("esbuild-plugin-less");
const {execSync} = require("child_process");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs");

const {IgnoreCSSPlugin} = require("@finos/perspective-build/ignore_css");
const {IgnoreFontsPlugin} = require("@finos/perspective-build/ignore_fonts");
const {WasmPlugin} = require("@finos/perspective-build/wasm");
const {WorkerPlugin} = require("@finos/perspective-build/worker");
const {NodeModulesExternal} = require("@finos/perspective-build/external");
const {ReplacePlugin} = require("@finos/perspective-build/replace");
const {build} = require("@finos/perspective-build/build");

function _compile(fileNames) {
    const ts = require("typescript");
    const path = require.resolve("@finos/perspective-viewer/tsconfig.json");
    const {compilerOptions} = JSON.parse(fs.readFileSync(path).toString());
    const {options} = ts.convertCompilerOptionsFromJson(compilerOptions, "");
    const host = ts.createCompilerHost(options);
    fs.mkdirSync("dist/esm", {recursive: true});
    host.writeFile = (path, contents) => fs.writeFileSync(path, contents);
    const program = ts.createProgram(fileNames, options, host);
    program.emit();
}

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

// This is dumb.  `splitting` param for `esbuild` outputs a `__require`/
// `__exports`/`__esModule` polyfill and does not tree-shake it;  this <1kb
// file blocks downloading of the wasm asset until after alot of JavaScript has
// parsed due to this multi-step download+eval.  Luckily `esbuild` is quite fast
// enough to just run another build to inline this one file `chunk.js`.
const POSTBUILD = [
    {
        entryPoints: ["dist/cdn/perspective-viewer.js"],
        format: "esm",
        plugins: [NodeModulesExternal()],
        external: ["*.wasm", "*.worker.js", "*.main.js"],
        outdir: "dist/cdn",
        allowOverwrite: true,
    },
];

async function build_all() {
    // generate declaration in parallel because tsc is sloooow.
    let tsc;
    if (fs.existsSync("dist/pkg/perspective_viewer.js")) {
        tsc = exec("yarn tsc --emitDeclarationOnly --outDir dist/esm");
    }

    await Promise.all(PREBUILD.map(build)).catch(() => process.exit(1));

    const debug = process.env.PSP_DEBUG ? "--debug" : "";
    execSync(
        `CARGO_TARGET_DIR=./build wasm-pack build ${debug} --out-dir dist/pkg --target web`,
        {
            stdio: "inherit",
            stderr: "inherit",
        }
    );

    if (typeof tsc === "undefined") {
        tsc = exec("yarn tsc --emitDeclarationOnly --outDir dist/esm");
    }

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    await Promise.all(POSTBUILD.map(build)).catch(() => process.exit(1));

    // legacy compat
    execSync("cpy dist/css/* dist/umd");

    const {stdout} = await tsc;
    console.log(stdout);
}

build_all();
