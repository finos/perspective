const {lessLoader} = require("esbuild-plugin-less");
const {execSync} = require("child_process");
const fs = require("fs");
const fflate = require("fflate");
const {build} = require("@finos/perspective-esbuild-plugin/build");
const {PerspectiveEsbuildPlugin} = require("@finos/perspective-esbuild-plugin");
const {
    wasm_opt,
    wasm_bindgen,
} = require("@finos/perspective-esbuild-plugin/rust_wasm");

const {
    IgnoreCSSPlugin,
} = require("@finos/perspective-esbuild-plugin/ignore_css");

const {
    IgnoreFontsPlugin,
} = require("@finos/perspective-esbuild-plugin/ignore_fonts");

const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");

// const {ReplacePlugin} = require("@finos/perspective-esbuild-plugin/replace");

const IS_DEBUG =
    !!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0;

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
        plugins: [IgnoreFontsPlugin(), lessLoader()],
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
        plugins: [lessLoader()],
        outdir: "dist/css",
    },
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        format: "esm",
        plugins: [
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            NodeModulesExternal(),
            // PerspectiveEsbuildPlugin(),

            // // Rust outputs a `URL()` when an explicit path for the wasm
            // // is not specified.  Esbuild ignores this, but webpack does not,
            // // and we always call this method with an explicit path, so this
            // // plugin strips this URL so webpack builds don't fail.
            // ReplacePlugin(/["']perspective_viewer_bg\.wasm["']/, "undefined"),
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
            PerspectiveEsbuildPlugin({
                wasm: {inline: true},
                worker: {inline: true},
            }),
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
            PerspectiveEsbuildPlugin(),
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

async function compile_rust() {
    const cargo_debug = IS_DEBUG ? "" : "--release";
    execSync(
        `CARGO_TARGET_DIR=./build cargo +nightly build ${cargo_debug} --lib --target wasm32-unknown-unknown -Z build-std=std,panic_abort -Z build-std-features=panic_immediate_abort`,
        INHERIT
    );

    await wasm_bindgen("perspective_viewer", {
        debug: IS_DEBUG,
        version: "0.2.82",
        targetdir: "build",
    });

    if (!IS_DEBUG) {
        await wasm_opt("perspective_viewer");
    }

    // Compress wasm
    const wasm = fs.readFileSync("dist/pkg/perspective_viewer_bg.wasm");
    const compressed = fflate.compressSync(wasm, {level: 9});
    fs.writeFileSync("dist/pkg/perspective_viewer_bg.wasm", compressed);
}

async function build_all() {
    await Promise.all(PREBUILD.map(build)).catch(() => process.exit(1));

    // Rust
    await compile_rust();

    // JavaScript
    execSync("yarn tsc --project tsconfig.json", INHERIT);
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    await Promise.all(POSTBUILD.map(build)).catch(() => process.exit(1));

    // legacy compat
    execSync("cpy dist/css/* dist/umd");
}

build_all();
