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

import { NodeModulesExternal } from "@finos/perspective-esbuild-plugin/external.js";
import { build } from "@finos/perspective-esbuild-plugin/build.js";
import { BuildCss } from "@prospective.co/procss/target/cjs/procss.js";
import * as fs from "node:fs";
import * as path_mod from "node:path";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);

const BUILD = [
    {
        entryPoints: ["src/js/plugin/plugin.js"],
        plugins: [NodeModulesExternal()],
        format: "esm",
        outfile: "dist/esm/perspective-viewer-openlayers.js",
        loader: {
            ".css": "text",
        },
    },
    {
        entryPoints: ["src/js/plugin/plugin.js"],
        plugins: [],
        format: "esm",
        outfile: "dist/cdn/perspective-viewer-openlayers.js",
        loader: {
            ".css": "text",
        },
    },
];

async function compile_css() {
    fs.mkdirSync("dist/css", { recursive: true });
    const builder = new BuildCss("");
    builder.add(
        "ol/ol.css",
        fs.readFileSync(_require.resolve("ol/ol.css")).toString()
    );
    builder.add(
        "./plugin.less",
        fs.readFileSync("./src/less/plugin.less").toString()
    );
    fs.writeFileSync(
        "dist/css/perspective-viewer-openlayers.css",
        builder.compile().get("plugin.css")
    );
}

async function build_all() {
    await compile_css();
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
