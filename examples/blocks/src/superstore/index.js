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

import { Workspace } from "@finos/perspective-workspace/dist/esm/perspective-workspace.js";
import perspective from "@finos/perspective/dist/esm/perspective.js";
import { DockPanel } from "@lumino/widgets";

import "@finos/perspective-viewer/dist/css/themes.css";
import "@finos/perspective-viewer/dist/esm/perspective-viewer.js";
import "@finos/perspective-viewer-datagrid/dist/esm/perspective-viewer-datagrid.js";
import "@finos/perspective-viewer-d3fc/dist/esm/perspective-viewer-d3fc.js";
import "@lumino/default-theme/style/index.css";
import "./index.css";

import arrow from "superstore-arrow/superstore.lz4.arrow";

async function get_layout() {
    const req = await fetch("layout.json");
    const json = await req.json();
    return json;
}

const datasource = async () => {
    const worker = perspective.worker();
    const request = fetch(arrow);
    const response = await request;
    const buffer = await response.arrayBuffer();
    return await worker.table(buffer);
};

let panel;

window.addEventListener("load", async () => {
    panel = new DockPanel();
    DockPanel.attach(panel, document.body);
    const workspace = new Workspace(panel);
    workspace.addTable("superstore", await datasource());
    workspace.restore(await get_layout());
});

window.addEventListener("resize", () => {
    if (panel) {
        panel.fit();
    }
});
