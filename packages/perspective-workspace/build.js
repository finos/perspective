const { execSync } = require("child_process");
const {
    NodeModulesExternal,
} = require("@finos/perspective-esbuild-plugin/external");
const { WasmPlugin } = require("@finos/perspective-esbuild-plugin/wasm");
const { WorkerPlugin } = require("@finos/perspective-esbuild-plugin/worker");
const { ResolvePlugin } = require("@finos/perspective-esbuild-plugin/resolve");
const { build } = require("@finos/perspective-esbuild-plugin/build");

const BUILD = [
    {
        entryPoints: ["src/js/perspective-workspace.js"],
        define: {
            global: "window",
        },
        format: "esm",
        plugins: [
            // Inlining `lumino` and importing the `.ts` source saves _50kb_
            NodeModulesExternal("@lumino"),
        ],
        loader: {
            ".html": "text",
            ".css": "text",
        },
        external: ["*.wasm"],
        outfile: "dist/esm/perspective-workspace.js",
    },
    {
        entryPoints: ["src/js/perspective-workspace.js"],
        define: {
            global: "window",
        },
        plugins: [
            ResolvePlugin({
                "@finos/perspective":
                    "@finos/perspective/dist/esm/perspective.js",
                "@finos/perspective-viewer":
                    "@finos/perspective-viewer/dist/esm/perspective-viewer.js",
            }),
            WasmPlugin(false),
            WorkerPlugin({ inline: false }),
        ],
        format: "esm",
        splitting: true,
        loader: {
            ".css": "text",
            ".html": "text",
        },
        outdir: "dist/cdn",
    },
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
    fs.mkdirSync("build/css", { recursive: true });
    fs.mkdirSync("dist/css", { recursive: true });
    const builder3 = new BuildCss("");

    add(builder3, "@lumino/widgets/style/widget.css");
    add(builder3, "@lumino/widgets/style/accordionpanel.css");
    add(builder3, "@lumino/widgets/style/commandpalette.css");
    add(builder3, "@lumino/widgets/style/dockpanel.css");
    add(builder3, "@lumino/widgets/style/menu.css");
    add(builder3, "@lumino/widgets/style/menubar.css");
    add(builder3, "@lumino/widgets/style/scrollbar.css");
    add(builder3, "@lumino/widgets/style/splitpanel.css");
    add(builder3, "@lumino/widgets/style/tabbar.css");
    add(builder3, "@lumino/widgets/style/tabpanel.css");

    add(builder3, "@lumino/widgets/style/menu.css");
    add(builder3, "@lumino/widgets/style/index.css");

    add(builder3, "./tabbar.less", "./src/less/tabbar.less");
    add(builder3, "./dockpanel.less", "./src/less/dockpanel.less");
    add(builder3, "./widget.less", "./src/less/widget.less");

    add(builder3, "./viewer.less", "./src/less/viewer.less");
    add(builder3, "./menu.less", "./src/less/menu.less");
    add(builder3, "./workspace.less", "./src/less/workspace.less");
    add(builder3, "./injected.less", "./src/less/injected.less");
    fs.writeFileSync(
        "build/css/workspace.css",
        builder3.compile().get("workspace.css")
    );

    fs.writeFileSync(
        "build/css/injected.css",
        builder3.compile().get("injected.css")
    );

    const builder = new BuildCss("./src/themes");
    add(
        builder,
        "fonts.less",
        "@finos/perspective-viewer/src/themes/fonts.less"
    );

    add(builder, "@finos/perspective-viewer/src/themes/pro.less");
    add(builder, "pro.scss", "./src/themes/pro.less");
    add(builder, "pro2.scss", "./src/themes/pro.less");
    fs.writeFileSync("dist/css/pro.css", builder.compile().get("pro2.css"));

    const builder2 = new BuildCss("./src/themes");
    add(
        builder2,
        "fonts.less",
        "@finos/perspective-viewer/src/themes/fonts.less"
    );
    add(builder2, "@finos/perspective-viewer/src/themes/pro.less");
    add(builder2, "@finos/perspective-viewer/src/themes/variables.less");
    add(
        builder2,
        "pro.less",
        "@finos/perspective-workspace/src/themes/pro.less"
    );
    add(
        builder2,
        "pro-dark-viewer.less",
        "@finos/perspective-viewer/src/themes/pro-dark.less"
    );
    add(builder2, "pro-dark2.scss", "./src/themes/pro-dark.less");
    fs.writeFileSync(
        "dist/css/pro-dark.css",
        builder2.compile().get("pro-dark2.css")
    );

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
