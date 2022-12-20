const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const {
    InlineCSSPlugin,
} = require("@finos/perspective-esbuild-plugin/inline_css");
const { UMDLoader } = require("@finos/perspective-esbuild-plugin/umd");
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
            "src/js/index/xy-scatter.ts",
            "src/js/index/y-scatter.js",
        ],
        define: {
            global: "window",
        },
        plugins: [InlineCSSPlugin(), NodeModulesExternal()],
        format: "esm",
        metafile: false,
        loader: {
            ".html": "text",
        },
        outdir: "dist/esm",
    },
    {
        entryPoints: ["src/js/index.js"],
        define: {
            global: "window",
        },
        plugins: [InlineCSSPlugin(), NodeModulesExternal()],
        format: "esm",
        loader: {
            ".html": "text",
        },
        outfile: "dist/esm/perspective-viewer-d3fc.js",
    },
    {
        entryPoints: ["src/js/index.js"],
        define: {
            global: "window",
        },
        globalName: "perspective_viewer_d3fc",
        plugins: [InlineCSSPlugin(), UMDLoader()],
        format: "cjs",
        loader: {
            ".html": "text",
        },
        outfile: "dist/umd/perspective-viewer-d3fc.js",
    },
    {
        entryPoints: ["src/js/index.js"],
        define: {
            global: "window",
        },
        plugins: [InlineCSSPlugin()],
        format: "esm",
        metafile: false,
        loader: {
            ".html": "text",
        },
        outfile: "dist/cdn/perspective-viewer-d3fc.js",
    },
];

async function build_all() {
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
