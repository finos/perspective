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

import cpy from "cpy";
import { WasmPlugin } from "@finos/perspective-esbuild-plugin/wasm.js";
import { WorkerPlugin } from "@finos/perspective-esbuild-plugin/worker.js";
// import { AMDLoader } from "@finos/perspective-esbuild-plugin/amd.js";
import { build } from "@finos/perspective-esbuild-plugin/build.js";
import * as path from "node:path";
import { BuildCss } from "@prospective.co/procss/target/cjs/procss.js";
import * as fs from "node:fs";
import * as url from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const _require = createRequire(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

const NBEXTENSION_PATH = path.resolve(
    __dirname,
    "..",
    "..",
    "python",
    "perspective",
    "perspective",
    "nbextension",
    "static"
);

const TEST_BUILD = {
    entryPoints: ["src/js/psp_widget.js"],
    define: {
        global: "window",
    },
    plugins: [WasmPlugin(true), WorkerPlugin({ inline: true })],
    globalName: "PerspectiveLumino",
    format: "esm",
    loader: {
        ".html": "text",
        ".ttf": "file",
        ".css": "text",
    },
    outfile: "dist/esm/lumino.js",
};

const LAB_BUILD = {
    entryPoints: ["src/js/index.js"],
    define: {
        global: "window",
    },
    plugins: [WasmPlugin(true), WorkerPlugin({ inline: true })],
    external: ["@jupyter*", "@lumino*"],
    format: "esm",
    loader: {
        ".css": "text",
        ".html": "text",
        ".ttf": "file",
    },
    outfile: "dist/esm/perspective-jupyterlab.js",
};

const NB_BUILDS = [
    // {
    //     entryPoints: ["src/js/notebook/extension.js"],
    //     define: {
    //         global: "window",
    //     },
    //     plugins: [
    //         WasmPlugin(true),
    //         WorkerPlugin({ inline: true }),
    //         AMDLoader([]),
    //     ],
    //     loader: {
    //         ".ttf": "file",
    //         ".css": "text",
    //     },
    //     external: ["@jupyter*", "@lumino*"],
    //     format: "cjs",
    //     outfile: path.join(NBEXTENSION_PATH, "extension.js"),
    // },
    // {
    //     entryPoints: ["src/js/notebook/index.js"],
    //     define: {
    //         global: "window",
    //     },
    //     plugins: [
    //         WasmPlugin(true),
    //         WorkerPlugin({ inline: true }),
    //         AMDLoader(["@jupyter-widgets/base"]),
    //     ],
    //     external: ["@jupyter*"],
    //     format: "cjs",
    //     loader: {
    //         ".ttf": "file",
    //         ".css": "text",
    //     },
    //     outfile: path.join(NBEXTENSION_PATH, "index.js"),
    // },
];

function add(builder, path, path2) {
    builder.add(
        path,
        fs.readFileSync(_require.resolve(path2 || path)).toString()
    );
}

const PROD_BUILD = [LAB_BUILD, ...NB_BUILDS];
const BUILD = process.argv.some((x) => x == "--test")
    ? [TEST_BUILD]
    : PROD_BUILD;

async function build_all() {
    fs.mkdirSync("dist/css", { recursive: true });
    const builder3 = new BuildCss("");
    add(builder3, "@finos/perspective-viewer/dist/css/themes.css");
    add(builder3, "./index.less", "./src/less/index.less");
    fs.writeFileSync(
        "dist/css/perspective-jupyterlab.css",
        builder3.compile().get("index.css")
    );

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    cpy(["src/less/*"], "dist/less");
    execSync("jupyter labextension build .", { stdio: "inherit" });

    const pkg = JSON.parse(fs.readFileSync("../../package.json").toString());
    const version = pkg.version.replace(/-(rc|alpha|beta)\.\d+/, (x) =>
        x.replace("-", "").replace(".", "")
    );

    const labext_dest = `../../rust/perspective-python/perspective_python-${version}.data/data/share/jupyter/labextensions/@finos/perspective-jupyterlab`;
    await cpy(["dist/cjs/**/*"], labext_dest);
}

build_all();
