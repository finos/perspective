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

const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const { build } = require("@finos/perspective-esbuild-plugin/build");
const util = require("node:util");
const execSync = util.promisify(require("node:child_process").execSync);

const BUILD = [
    {
        entryPoints: [
            "src/ts/index/area.ts",
            "src/ts/index/bar.ts",
            "src/ts/index/candlestick.ts",
            "src/ts/index/column.ts",
            "src/ts/index/heatmap.ts",
            "src/ts/index/line.ts",
            "src/ts/index/ohlc.ts",
            "src/ts/index/sunburst.ts",
            "src/ts/index/xy-scatter.ts",
            "src/ts/index/y-scatter.ts",
        ],
        define: {
            global: "window",
        },
        plugins: [NodeModulesExternal()],
        format: "esm",
        metafile: false,
        loader: {
            ".css": "text",
            ".html": "text",
        },
        outdir: "dist/esm",
    },
    {
        entryPoints: ["src/ts/index.ts"],
        define: {
            global: "window",
        },
        plugins: [NodeModulesExternal()],
        format: "esm",
        loader: {
            ".css": "text",
            ".html": "text",
        },
        outfile: "dist/esm/perspective-viewer-d3fc.js",
    },
    {
        entryPoints: ["src/ts/index.ts"],
        define: {
            global: "window",
        },
        plugins: [],
        format: "esm",
        metafile: false,
        loader: {
            ".css": "text",
            ".html": "text",
        },
        outfile: "dist/cdn/perspective-viewer-d3fc.js",
    },
];

const { BuildCss } = require("@prospective.co/procss/target/cjs/procss.js");
const fs = require("fs");
const path_mod = require("path");
function add(builder, path) {
    builder.add(
        path,
        fs.readFileSync(path_mod.join("./src/less", path)).toString()
    );
}

async function compile_css() {
    fs.mkdirSync("dist/css", { recursive: true });
    const builder = new BuildCss("");
    add(builder, "./series_colors.less");
    add(builder, "./gradient_colors.less");
    add(builder, "./chart.less");
    fs.writeFileSync(
        "dist/css/perspective-viewer-d3fc.css",
        builder.compile().get("chart.css")
    );
}

async function build_all() {
    // NOTE: compile_css and other build step must be run before tsc, because
    // (for now) nothing runs after the tsc step.
    await compile_css();
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));

    // esbuild can handle typescript files, and strips out types from the output,
    // but it is unable to check types, so we must run tsc as a separate step.
    try {
        await execSync("tsc", { stdio: "inherit" });
    } catch (error) {
        console.error(error);
        // tsc errors tend to get buried when running multiple package builds. If
        // the perspective-viewer-d3fc build fails, then plugins will not be present
        // when running tests, leading to a large number of tests failing, but without
        // a great indication of why.
        process.exit(1);
    }
}

build_all();
