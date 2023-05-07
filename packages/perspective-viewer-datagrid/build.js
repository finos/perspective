const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const { build } = require("@finos/perspective-esbuild-plugin/build");

const BUILD = [
    {
        define: {
            global: "window",
        },
        entryPoints: ["src/js/index.js"],
        plugins: [NodeModulesExternal()],
        format: "esm",
        loader: {
            ".css": "text",
            ".html": "text",
        },
        outfile: "dist/esm/perspective-viewer-datagrid.js",
    },
    {
        define: {
            global: "window",
        },
        entryPoints: ["src/js/index.js"],
        plugins: [],
        format: "esm",
        loader: {
            ".css": "text",
            ".html": "text",
        },
        outfile: "dist/cdn/perspective-viewer-datagrid.js",
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
    const builder1 = new BuildCss("");
    add(builder1, "./pro.less");
    add(builder1, "./mitered-headers.less");
    add(builder1, "./row-hover.less");
    add(builder1, "./column-plugin.less");
    add(builder1, "./regular_table.less");
    fs.writeFileSync(
        "dist/css/perspective-viewer-datagrid.css",
        builder1.compile().get("regular_table.css")
    );

    const builder2 = new BuildCss("");
    add(builder2, "./toolbar.less");
    fs.writeFileSync(
        "dist/css/perspective-viewer-datagrid-toolbar.css",
        builder2.compile().get("toolbar.css")
    );
}

async function build_all() {
    await compile_css();
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
