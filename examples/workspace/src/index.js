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

import perspective from "@finos/perspective";
import "@finos/perspective-workspace";
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import "./index.css";
import "@finos/perspective-workspace/dist/css/pro.css";
import "@finos/perspective-viewer/dist/css/themes.css";

const datasource = async () => {
    const req = fetch("./superstore.lz4.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const worker = await perspective.worker();
    return await worker.table(buffer);
};

const DEFAULT_LAYOUT = {
    master: {
        widgets: ["Four", "Three"],
    },
    detail: {
        main: {
            currentIndex: 0,
            type: "tab-area",
            widgets: ["One", "Two"],
        },
    },
    viewers: {
        One: {
            table: "superstore",
            title: "Test Widget I",
            editable: true,
            linked: true,
        },
        Two: {
            table: "superstore",
            title: "Test Widget II (modified)",
            linked: true,
        },
        Three: {
            table: "superstore",
            title: "Test Widget III (modified)",
            group_by: ["State"],
            columns: ["Sales", "Profit"],
            linked: true,
        },
        Four: {
            table: "superstore",
            title: "Test Widget IV (modified)",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Profit"],
            linked: true,
        },
    },
};

window.workspace.tables.set("superstore", datasource());
const savedLayout = localStorage.getItem("layout");
window.workspace.restore(
    savedLayout ? JSON.parse(savedLayout) : DEFAULT_LAYOUT
);
window.workspace.addEventListener("workspace-layout-update", async () => {
    localStorage.setItem(
        "layout",
        JSON.stringify(await window.workspace.save())
    );
});
