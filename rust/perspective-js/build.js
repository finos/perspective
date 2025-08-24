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
import { NodeModulesExternal } from "@finos/perspective-esbuild-plugin/external.js";
import cpy from "cpy";
import "zx/globals";
import { compress } from "pro_self_extracting_wasm";

const IS_DEBUG =
    !!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0;

const BUILD = [
    {
        entryPoints: ["src/ts/perspective-server.worker.ts"],
        format: "esm",
        target: "es2022",
        // plugins: [PerspectiveEsbuildPlugin()],
        // loader: { ".wasm": "binary" },
        outfile: "dist/cdn/perspective-server.worker.js",
    },
    // WASM assets inlined into a single monolithic `.js` file. No special
    // loades required, this version of Perspective should be the easiest
    // to use but also the least performant at load time.
    // {
    //     'Import via `<script type="module">`': true,
    //     "Requires WASM bootstrap": false,
    //     "Load as binary": false,
    //     "Bundler friendly": true,
    // },
    {
        entryPoints: ["src/ts/perspective.inline.ts"],
        format: "esm",
        target: "es2022",
        plugins: [PerspectiveEsbuildPlugin()],
        loader: { ".wasm": "binary" },
        outfile: "dist/esm/perspective.inline.js",
    },
    // WASM assets linked to relative path via `fetch()`. This efficiently
    // loading build is great for `<script>` tags but will give many
    // bundlers trouble.
    // {
    //     'Import via `<script type="module">`': true,
    //     "Requires WASM bootstrap": false,
    //     "Load as binary": true,
    //     "Bundler friendly": false,
    // },
    {
        entryPoints: ["src/ts/perspective.cdn.ts"],
        format: "esm",
        target: "es2022",
        plugins: [PerspectiveEsbuildPlugin()],
        outfile: "dist/cdn/perspective.js",
    },
    // No WASM assets inlined or linked.
    // {
    //     'Import via `<script type="module">`': true, // *******
    //     "Requires WASM bootstrap": true,
    //     "Load as binary": true,
    //     "Bundler friendly": true,
    // },
    {
        entryPoints: ["src/ts/perspective.browser.ts"],
        format: "esm",
        target: "es2022",
        plugins: [PerspectiveEsbuildPlugin()],
        outfile: "dist/esm/perspective.js",
    },
    // Node.js build
    // {
    //     'Import via `<script type="module">`': false,
    //     "Requires WASM bootstrap": false,
    //     "Load as binary": true,
    //     "Bundler friendly": false,
    // },
    {
        entryPoints: ["src/ts/perspective.node.ts"],
        format: "esm",
        platform: "node",
        target: "es2022",
        minify: false,
        plugins: [PerspectiveEsbuildPlugin(), NodeModulesExternal()],
        loader: { ".wasm": "binary" },
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

async function build_rust() {
    const release_flag = IS_DEBUG ? "" : "--release";
    execSync(
        `PSP_ROOT_DIR=../.. cargo bundle --target=${get_host()} -- perspective_js ${release_flag} --features="export-init,talc-allocator"`,
        INHERIT
    );

    await compress(
        "dist/wasm/perspective-js.wasm",
        "dist/wasm/perspective-js.wasm"
    );
}

async function build_web_assets() {
    await cpy(["../../rust/perspective-server/dist/web/*"], "dist/wasm");
    await Promise.all(BUILD.map(build)).catch((e) => {
        console.error(e);
        process.exit(1);
    });
}

async function build_all() {
    await build_rust();
    await build_web_assets();

    // Typecheck
    await $`npx tsc --project ./tsconfig.browser.json`.stdio(
        "inherit",
        "inherit",
        "inherit"
    );

    await $`npx tsc --project ./tsconfig.node.json`.stdio(
        "inherit",
        "inherit",
        "inherit"
    );
}

build_all();
