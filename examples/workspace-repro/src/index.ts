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

// # [Perspective bootstrapping](https://perspective.finos.org/guide/how_to/javascript/importing.html)

// Here we're initializing the WASM interpreter that powers the perspective API
// and viewer, as covered in the [user guide section on bundling](https://perspective.finos.org/guide/how_to/javascript/importing.html).
// This example is written assuming that the bundler is configured
// to treat these files as a "file" and returns a path as the default export.
// Use ./build.js as an example. The type stubs are in ./globals.d.ts

import perspective from "@finos/perspective";
import perspective_viewer from "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm";
import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm";

await Promise.all([
    perspective.init_server(fetch(SERVER_WASM)),
    perspective_viewer.init_client(fetch(CLIENT_WASM)),
]);

// # Data Source

// Data source creates a static Web Worker instance of Perspective engine, and a
// table creation function which both downloads data and loads it into the
// engine.

import type * as psp from "@finos/perspective";
import type * as pspViewer from "@finos/perspective-viewer";
import * as Workspace from "@finos/perspective-workspace";

const CLIENT = await perspective.worker();

import { PerspectiveWorkspaceConfig } from "@finos/perspective-workspace";

import "@finos/perspective-viewer/dist/css/pro.css";
import "@finos/perspective-workspace/dist/css/pro.css";
import "./index.css";

await customElements.whenDefined("perspective-workspace");
const ready = document.createElement("div");
ready.innerText = "READY";
document.querySelector("nav.header")?.appendChild(ready);

const workspace = document.createElement(
    "perspective-workspace"
) as Workspace.HTMLPerspectiveWorkspaceElement;
document.body.appendChild(workspace);

const tablesMain: Record<string, Promise<psp.Table>> = {};
const tablesSwap: Record<string, Promise<psp.Table>> = {};

let layout: PerspectiveWorkspaceConfig<string> = {
    sizes: [1],
    viewers: {},
    detail: undefined,
};
let swap = false;

function addViewer() {
    const name = window.crypto.randomUUID().slice(0, 7);
    tablesMain[name] = CLIENT.table("a,b,c\n1,2,3");
    tablesSwap[name] = CLIENT.table("a,b,c\n4,5,6\n7,8,9");
    workspace.addTable(name, swap ? tablesMain[name] : tablesSwap[name]);

    layout = Workspace.addViewer(layout, { table: name, title: name });
    workspace.restore(layout);
}

document.querySelector("button.add")?.addEventListener("click", () => {
    addViewer();
});

workspace.restore({
    sizes: [],
    viewers: {},
    detail: undefined,
});

workspace.restore({
    sizes: [],
    viewers: {
        PERSPECTIVE_GENERATED_ID_0: {
            title: "a",
            table: "a",
        },
    },
    detail: {
        main: {
            type: "split-area",
            sizes: [1],
            orientation: "horizontal",
            children: [
                {
                    type: "tab-area",
                    currentIndex: 0,
                    widgets: ["PERSPECTIVE_GENERATED_ID_0"],
                },
            ],
        },
    },
});
workspace.addTable("a", CLIENT.table("a,b,c\n1,2,3"));
workspace.restore({
    sizes: [1],
    detail: {
        main: {
            type: "tab-area",
            widgets: ["PERSPECTIVE_GENERATED_ID_0"],
            currentIndex: 0,
        },
    },
    viewers: {
        PERSPECTIVE_GENERATED_ID_0: {
            version: "3.7.4",
            plugin: "Datagrid",
            plugin_config: {
                columns: {},
                edit_mode: "READ_ONLY",
                scroll_lock: false,
            },
            columns_config: {},
            theme: "Pro Light",
            title: "a",
            group_by: [],
            split_by: [],
            sort: [],
            filter: [],
            expressions: {},
            columns: [],
            aggregates: {},
            table: "a",
            settings: false,
        },
    },
});
