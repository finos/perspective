const { execSync } = require("child_process");
const fs = require("fs");
const { build } = require("@finos/perspective-esbuild-plugin/build");
const {
    PerspectiveEsbuildPlugin,
} = require("@finos/perspective-esbuild-plugin");

const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");

const cpy_mod = import("cpy");

const IS_DEBUG =
    !!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0;

const BUILD = [
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        format: "esm",
        plugins: [NodeModulesExternal()],
        external: ["*.wasm", "*.worker.js"],
        outdir: "dist/esm",
    },
    {
        entryPoints: ["src/ts/perspective-viewer.ts"],
        plugins: [
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
        plugins: [PerspectiveEsbuildPlugin()],
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
    // Rust
    execSync(`cargo bundle ${IS_DEBUG ? "" : "--release"}`, INHERIT);

    // JavaScript
    execSync("npx tsc --project tsconfig.json", INHERIT);
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    await Promise.all(POSTBUILD.map(build)).catch(() => process.exit(1));

    // legacy compat
    const { default: cpy } = await cpy_mod;
    cpy("target/themes/*", "dist/css");
    cpy("target/themes/*", "dist/umd");
    cpy("dist/pkg/*", "dist/esm");
}

build_all();
