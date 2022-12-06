const { execSync } = require("child_process");
const fs = require("fs");
const fflate = require("fflate");
const { build } = require("@finos/perspective-esbuild-plugin/build");
const {
    PerspectiveEsbuildPlugin,
} = require("@finos/perspective-esbuild-plugin");
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

const IS_DEBUG =
    !!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0;

const BUILD = [
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        format: "esm",
        plugins: [
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            NodeModulesExternal(),
        ],
        external: ["*.wasm", "*.worker.js"],
        outdir: "dist/esm",
    },
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        plugins: [
            IgnoreCSSPlugin(),
            IgnoreFontsPlugin(),
            PerspectiveEsbuildPlugin({
                wasm: { inline: true },
                worker: { inline: true },
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
    execSync(`cargo build ${cargo_debug}`, INHERIT);
    await wasm_bindgen("perspective", {
        debug: IS_DEBUG,
        version: "0.2.82",
        targetdir: "build",
    });

    if (!IS_DEBUG) {
        await wasm_opt("perspective");
    }

    // Compress wasm
    const wasm = fs.readFileSync("dist/pkg/perspective_bg.wasm");
    const compressed = fflate.compressSync(wasm, { level: 9 });
    fs.writeFileSync("dist/pkg/perspective_bg.wasm", compressed);
}

async function build_all() {
    // Rust
    await compile_rust();

    // JavaScript
    execSync("yarn tsc --project tsconfig.json", INHERIT);
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    await Promise.all(POSTBUILD.map(build)).catch(() => process.exit(1));

    // legacy compat
    execSync("cpy target/themes/* dist/css");
    execSync("cpy dist/css/* dist/umd");
}

build_all();
