// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { execSync } from "child_process";
import { build } from "@finos/perspective-esbuild-plugin/build.js";
import { PerspectiveEsbuildPlugin } from "@finos/perspective-esbuild-plugin";
import * as fs from "node:fs";
import { NodeModulesExternal } from "@finos/perspective-esbuild-plugin/external.js";
import cpy from "cpy";

const cpy_mod = import("cpy");

const IS_DEBUG =
    !!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0;

const BUILD = [
    {
        entryPoints: ["src/ts/perspective.inline.ts"],
        format: "esm",
        target: "es2022",
        plugins: [
            PerspectiveEsbuildPlugin({
                wasm: { inline: true },
                worker: { inline: true },
            }),
        ],
        outfile: "dist/esm/perspective.inline.js",
    },
    {
        entryPoints: ["src/ts/perspective.ts"],
        format: "esm",
        target: "es2022",
        plugins: [PerspectiveEsbuildPlugin()],
        outdir: "dist/cdn",
    },
    {
        entryPoints: ["src/ts/perspective.ts"],
        format: "esm",
        target: "es2022",
        external: ["*.wasm", "*.worker.js"],
        outdir: "dist/esm",
    },
    {
        entryPoints: ["src/ts/perspective.node.ts"],
        format: "esm",
        platform: "node",
        target: "es2022",
        minify: false,
        plugins: [
            PerspectiveEsbuildPlugin({ wasm: { inline: true } }),
            NodeModulesExternal(),
        ],
        outdir: "dist/esm",
    },
];

const INHERIT = {
    stdio: "inherit",
    stderr: "inherit",
};

function get_host() {
    return /host\: (.+?)$/gm.exec(execSync(`rustc -vV`).toString())[1];
}

// Rust compile-time metadata
function build_metadata() {
    execSync(
        `PSP_ROOT_DIR=../.. cargo build -p perspective-js --bin perspective-js-metadata --target=${get_host()} --features=external-cpp`,
        INHERIT
    );

    execSync(
        `TS_RS_EXPORT_DIR='./src/ts/ts-rs' ../target/${get_host()}/debug/perspective-js-metadata`
    );
}

function build_rust() {
    const release_flag = IS_DEBUG ? "" : "--release";
    execSync(
        `PSP_ROOT_DIR=../.. cargo bundle --target=${get_host()} -- perspective_js ${release_flag} --features=export-init,external-cpp`,
        INHERIT
    );
}

async function build_web_assets() {
    await cpy(["../../cpp/perspective/dist/web/*"], "dist/pkg/web");
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

async function build_all() {
    build_rust();
    await build_web_assets();
    build_metadata();

    // "files": ["./src/ts/perspective.node.ts", "./src/ts/perspective.ts"]
    // Typecheck
    execSync("npx tsc --project ./tsconfig.browser.json", INHERIT);
    // execSync("npx tsc --project ./tsconfig.browser.json", INHERIT);
    await cpy("target/themes/*", "dist/css");
    await cpy("target/themes/*", "dist/css");
}

build_all();
