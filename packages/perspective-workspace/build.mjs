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
import { WasmPlugin } from "@finos/perspective-esbuild-plugin/wasm.js";
import { WorkerPlugin } from "@finos/perspective-esbuild-plugin/worker.js";
import { ResolvePlugin } from "@finos/perspective-esbuild-plugin/resolve.js";
import { build } from "@finos/perspective-esbuild-plugin/build.js";
import { BuildCss } from "@prospective.co/procss/target/cjs/procss.js";
import * as fs from "node:fs";
import { createRequire } from "node:module";

import "zx/globals";

const _require = createRequire(import.meta.url);

const BUILD = [
    {
        entryPoints: ["src/ts/perspective-workspace.ts"],
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
        entryPoints: ["src/ts/perspective-workspace.ts"],
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

function add(builder, path, path2) {
    builder.add(
        path,
        fs.readFileSync(_require.resolve(path2 || path)).toString()
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

    const pro = new BuildCss("./src/themes");
    add(pro, "icons.less", "@finos/perspective-viewer/src/themes/icons.less");
    add(pro, "intl.less", "@finos/perspective-viewer/src/themes/intl.less");
    add(pro, "pro.less", "@finos/perspective-viewer/src/themes/pro.less");
    add(pro, "output.scss", "./src/themes/pro.less");
    fs.writeFileSync("dist/css/pro.css", pro.compile().get("output.css"));

    const pro_dark = new BuildCss("./src/themes");
    add(
        pro_dark,
        "icons.less",
        "@finos/perspective-viewer/src/themes/icons.less"
    );
    add(
        pro_dark,
        "intl.less",
        "@finos/perspective-viewer/src/themes/intl.less"
    );
    add(pro_dark, "pro.less", "@finos/perspective-viewer/src/themes/pro.less");
    add(
        pro_dark,
        "pro-dark.less",
        "@finos/perspective-viewer/src/themes/pro-dark.less"
    );
    // add(builder2, "@finos/perspective-viewer/src/themes/pro-dark.less");
    // add(builder2, "pro-workspace.less", "./src/themes/pro.less");
    // add(builder2, "@finos/perspective-viewer/src/themes/variables.less");
    add(pro_dark, "output.scss", "./src/themes/pro-dark.less");
    fs.writeFileSync(
        "dist/css/pro-dark.css",
        pro_dark.compile().get("output.css")
    );

    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));

    try {
        await $`tsc --project ./tsconfig.json`.stdio(
            "inherit",
            "inherit",
            "inherit"
        );
    } catch (e) {
        process.exit(1);
    }
}

build_all();
