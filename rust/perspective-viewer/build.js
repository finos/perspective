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
import * as fs from "node:fs";
import { BuildCss } from "@prospective.co/procss/target/cjs/procss.js";

import cpy from "cpy";

const IS_DEBUG =
    !!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0;

const INHERIT = {
    stdio: "inherit",
    stderr: "inherit",
};

function get_host() {
    return /host\: (.+?)$/gm.exec(execSync(`rustc -vV`).toString())[1];
}
async function build_all() {
    execSync(
        `cargo bundle --target=${get_host()} -- perspective_viewer ${
            IS_DEBUG ? "" : "--release"
        }`,
        INHERIT
    );

    // JavaScript
    const BUILD = [
        {
            entryPoints: ["src/ts/perspective-viewer.ts"],
            format: "esm",
            plugins: [
                PerspectiveEsbuildPlugin({
                    wasm: { inline: true },
                }),
            ],
            outfile: "dist/esm/perspective-viewer.inline.js",
        },
        {
            entryPoints: ["src/ts/perspective-viewer.ts"],
            format: "esm",
            plugins: [NodeModulesExternal()],
            external: ["*.wasm"],
            outdir: "dist/esm",
        },
        {
            entryPoints: ["src/ts/perspective-viewer.ts"],
            format: "esm",
            plugins: [PerspectiveEsbuildPlugin({ wasm: { inline: true } })],
            outfile: "dist/esm/perspective-viewer.inline.js",
        },
        {
            entryPoints: ["src/ts/perspective-viewer.ts"],
            format: "esm",
            plugins: [PerspectiveEsbuildPlugin()],
            splitting: true,
            outdir: "dist/cdn",
        },
    ];

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));

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

    await Promise.all(POSTBUILD.map(build)).catch(() => process.exit(1));

    // Typecheck
    execSync("npx tsc --project tsconfig.json", INHERIT);

    // Generate themes. `cargo` is not a great tool for this as there's no
    // simple way to find the output artifact.
    function add(builder, path) {
        builder.add(path, fs.readFileSync(`./src/themes/${path}`).toString());
    }

    fs.mkdirSync("./dist/css/intl", { recursive: true });
    const builder = new BuildCss("./src/themes");
    add(builder, "variables.less");
    add(builder, "intl.less");
    add(builder, "icons.less");
    add(builder, "pro.less");
    add(builder, "pro-dark.less");
    add(builder, "monokai.less");
    add(builder, "solarized.less");
    add(builder, "solarized-dark.less");
    add(builder, "vaporwave.less");
    add(builder, "gruvbox.less");
    add(builder, "gruvbox-dark.less");
    add(builder, "dracula.less");
    add(builder, "themes.less");
    for (const [name, css] of builder.compile()) {
        fs.writeFileSync(`dist/css/${name}`, css);
    }

    const intl_builder = new BuildCss("./src/themes/intl");
    add(intl_builder, "intl/de.less");
    add(intl_builder, "intl/es.less");
    add(intl_builder, "intl/fr.less");
    add(intl_builder, "intl/ja.less");
    add(intl_builder, "intl/pt.less");
    add(intl_builder, "intl/zh.less");
    for (const [name, css] of intl_builder.compile()) {
        fs.writeFileSync(`dist/css/intl/${name}`, css);
    }
}

build_all();
