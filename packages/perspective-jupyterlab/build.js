const cpy_mod = import("cpy");

const { WasmPlugin } = require("@finos/perspective-esbuild-plugin/wasm");
const { WorkerPlugin } = require("@finos/perspective-esbuild-plugin/worker");
const { UMDLoader } = require("@finos/perspective-esbuild-plugin/umd");
const { build } = require("@finos/perspective-esbuild-plugin/build");

const TEST_BUILD = {
    entryPoints: ["src/js/psp_widget.js"],
    define: {
        global: "window",
    },
    plugins: [WasmPlugin(true), WorkerPlugin({ inline: true }), UMDLoader()],
    globalName: "PerspectiveLumino",
    format: "cjs",
    loader: {
        ".html": "text",
        ".ttf": "file",
        ".css": "text",
    },
    outfile: "dist/umd/lumino.js",
};

const PROD_BUILD = {
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
    outfile: "dist/umd/perspective-jupyterlab.js",
};

const BUILD = [
    process.argv.some((x) => x == "--test") ? TEST_BUILD : PROD_BUILD,
];

const { BuildCss } = require("@prospective.co/procss/target/cjs/procss.js");
const fs = require("fs");

function add(builder, path, path2) {
    builder.add(
        path,
        fs.readFileSync(require.resolve(path2 || path)).toString()
    );
}

async function build_all() {
    const { default: cpy } = await cpy_mod;
    fs.mkdirSync("dist/css", { recursive: true });
    const builder3 = new BuildCss("");

    add(builder3, "@finos/perspective-viewer/dist/css/themes.css");
    add(builder3, "./index.less", "./src/less/index.less");
    fs.writeFileSync(
        "dist/css/perspective-jupyterlab.css",
        builder3.compile().get("index.css")
    );

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
    cpy(["dist/css/*"], "dist/umd");
    cpy(["src/less/*"], "dist/less");
}

build_all();
