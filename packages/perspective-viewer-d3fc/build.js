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

const BUILD = [
    {
        entryPoints: [
            "src/js/index/area.js",
            "src/js/index/bar.js",
            "src/js/index/candlestick.js",
            "src/js/index/column.js",
            "src/js/index/heatmap.js",
            "src/js/index/line.js",
            "src/js/index/ohlc.js",
            "src/js/index/sunburst.js",
            "src/js/index/xy-scatter.js",
            "src/js/index/y-scatter.js",
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
        entryPoints: ["src/js/index.js"],
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
        entryPoints: ["src/js/index.js"],
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
    await compile_css();
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
