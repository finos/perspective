const {lessLoader} = require("esbuild-plugin-less");
const {execSync} = require("child_process");
const util = require("util");
const fs = require("fs");
const fflate = require("fflate");

const {download_wasm_opt} = require("@finos/perspective-build/rust_wasm");
const {IgnoreCSSPlugin} = require("@finos/perspective-build/ignore_css");
const {IgnoreFontsPlugin} = require("@finos/perspective-build/ignore_fonts");
const {WasmPlugin} = require("@finos/perspective-build/wasm");
const {WorkerPlugin} = require("@finos/perspective-build/worker");
const {NodeModulesExternal} = require("@finos/perspective-build/external");
const {ReplacePlugin} = require("@finos/perspective-build/replace");
const {build} = require("@finos/perspective-build/build");

const IS_DEBUG =
    !!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0;

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
            "dropdown-menu",
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
            "src/themes/themes.less",
            "src/themes/material.less",
            "src/themes/material-dark.less",
            "src/themes/monokai.less",
            "src/themes/solarized.less",
            "src/themes/solarized-dark.less",
            "src/themes/vaporwave.less",
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
        entryPoints: ["src/ts/migrate.ts"],
        format: "cjs",
        outfile: "dist/cjs/migrate.js",
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

const INHERIT = {
    stdio: "inherit",
    stderr: "inherit",
};

async function build_all() {
    await Promise.all(PREBUILD.map(build)).catch(() => process.exit(1));
    const cargo_debug = IS_DEBUG ? "" : "--release";

    // Compile rust
    execSync(
        `CARGO_TARGET_DIR=./build cargo +nightly build ${cargo_debug} --lib --target wasm32-unknown-unknown -Z build-std=std,panic_abort -Z build-std-features=panic_immediate_abort`,
        INHERIT
    );

    // Find `wasm-bindgen` CLI
    try {
        execSync(`which wasm-bindgen`, INHERIT);
    } catch (e) {
        console.log(`No \`wasm-bindgen-cli\` found, installing`);
        execSync(`cargo install wasm-bindgen-cli --version 0.2.74`, INHERIT);
    }

    // Generate wasm-bindgen bindings
    const wasm_bindgen_debug = IS_DEBUG ? "--debug" : "";
    const profile_dir = IS_DEBUG ? "debug" : "release";
    const UNOPT_PATH = `build/wasm32-unknown-unknown/${profile_dir}/perspective_viewer.wasm`;
    execSync(
        `wasm-bindgen ${UNOPT_PATH} ${wasm_bindgen_debug} --out-dir dist/pkg --typescript --target web`,
        INHERIT
    );

    if (!IS_DEBUG) {
        // Find `wasm-opt`
        const WASM_OPT = `../../tools/perspective-build/lib/wasm-opt`;
        if (!fs.existsSync(WASM_OPT)) {
            console.log(`No \`wasm-opt\` found, installing`);
            await download_wasm_opt();
        }

        // Optimize wasm
        const OPT_PATH = `dist/pkg/perspective_viewer_bg.wasm`;
        const WASM_OPT_OPTIONS = [
            `-lmu`,
            `--dce`,
            `--strip-producers`,
            `--strip-target-features`,
            `--strip-debug`,
        ].join(" ");

        execSync(
            `${WASM_OPT} -Oz ${WASM_OPT_OPTIONS} -o wasm-opt.wasm ${OPT_PATH}`,
            INHERIT
        );
        execSync(`mv wasm-opt.wasm ${OPT_PATH}`, INHERIT);
    }

    // Compress wasm
    const wasm = fs.readFileSync("dist/pkg/perspective_viewer_bg.wasm");
    const compressed = fflate.compressSync(wasm, {level: 9});
    fs.writeFileSync("dist/pkg/perspective_viewer_bg.wasm", compressed);

    // JavaScript
    execSync("yarn tsc --project tsconfig.json", INHERIT);

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    await Promise.all(POSTBUILD.map(build)).catch(() => process.exit(1));

    // legacy compat
    execSync("cpy dist/css/* dist/umd");
}

build_all();
