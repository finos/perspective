const cpy = require("cpy");
const { lessLoader } = require("esbuild-plugin-less");
const { WasmPlugin } = require("@finos/perspective-esbuild-plugin/wasm");
const { WorkerPlugin } = require("@finos/perspective-esbuild-plugin/worker");
const { AMDLoader } = require("@finos/perspective-esbuild-plugin/amd");
const { UMDLoader } = require("@finos/perspective-esbuild-plugin/umd");
const { ReplacePlugin } = require("@finos/perspective-esbuild-plugin/replace");
const { build } = require("@finos/perspective-esbuild-plugin/build");
const path = require("path");

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

const THEMES_BUILD = {
    entryPoints: ["src/less/index.less"],
    plugins: [WasmPlugin(false), lessLoader()],
    outdir: "dist/css",
};

const TEST_BUILD = {
    entryPoints: ["src/js/psp_widget.js"],
    define: {
        global: "window",
    },
    plugins: [
        lessLoader(),
        WasmPlugin(true),
        WorkerPlugin({ inline: true }),
        UMDLoader(),
    ],
    globalName: "PerspectiveLumino",
    format: "cjs",
    loader: {
        ".html": "text",
        ".ttf": "file",
    },
    outfile: "dist/umd/lumino.js",
};

const LAB_BUILD = {
    entryPoints: ["src/js/index.js"],
    define: {
        global: "window",
    },
    plugins: [
        lessLoader(),
        WasmPlugin(true),
        WorkerPlugin({ inline: true }),

        // See note in `rust/perspective-viewer/build.js`
        ReplacePlugin(/["']perspective_viewer_bg\.wasm["']/, "undefined"),
    ],
    external: ["@jupyter*", "@lumino*"],
    format: "esm",
    loader: {
        ".ttf": "file",
    },
    outfile: "dist/umd/perspective-jupyterlab.js",
};

const NB_BUILDS = [
    {
        entryPoints: ["src/js/notebook/extension.js"],
        define: {
            global: "window",
        },
        plugins: [WasmPlugin(true), WorkerPlugin(true), AMDLoader([])],
        loader: {
            ".ttf": "file",
            ".css": "text",
        },
        external: ["@jupyter*", "@lumino*"],
        format: "cjs",
        outfile: path.join(NBEXTENSION_PATH, "extension.js"),
    },
    {
        entryPoints: ["src/js/notebook/index.js"],
        define: {
            global: "window",
        },
        plugins: [
            WasmPlugin(true),
            WorkerPlugin(true),
            AMDLoader([`@jupyter-widgets/base`]),
        ],
        external: ["@jupyter*"],
        format: "cjs",
        loader: {
            ".ttf": "file",
        },
        outfile: path.join(NBEXTENSION_PATH, "index.js"),
    },
];

const PROD_BUILD = [LAB_BUILD, ...NB_BUILDS];
const BUILD = process.argv.some((x) => x == "--test") ? TEST_BUILD : PROD_BUILD;

async function build_all() {
    await build(THEMES_BUILD);
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    cpy(["dist/css/*"], "dist/umd");
    cpy(["src/less/*"], "dist/less");
}

build_all();
