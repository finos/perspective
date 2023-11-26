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

import perspective from "@finos/perspective/dist/esm/perspective.js";
import { Workspace } from "@finos/perspective-workspace/dist/esm/perspective-workspace.js";
import { DockPanel } from "@lumino/widgets";

import "@finos/perspective-viewer/dist/css/themes.css";
import "@finos/perspective-viewer/dist/esm/perspective-viewer.js";
import "@finos/perspective-viewer-datagrid/dist/esm/perspective-viewer-datagrid.js";
import "@finos/perspective-viewer-d3fc/dist/esm/perspective-viewer-d3fc.js";
import "@lumino/default-theme/style/index.css";
import "./index.css";

const datasource = async () => {
    const worker = perspective.worker();
    const request = fetch("./olympics.arrow");
    const response = await request;
    const arrow = await response.arrayBuffer();
    const table = await worker.table(arrow);
    return table;
};

const layout = {
    detail: {
        main: {
            type: "tab-area",
            widgets: ["viewer0", "viewer1"],
            currentIndex: 1,
        },
    },
    viewers: {
        viewer0: {
            plugin: "X/Y Scatter",
            title: "Avg Height vs Weight by Sport",
            group_by: ["Sport"],
            columns: ["Height", "Weight", null, "City", null, "Sport", null],
            filter: [["Height", "==", null]],
            sort: [["Name", "desc"]],
            expressions: {},
            aggregates: {
                Name: "distinct count",
                Weight: "avg",
                Sport: "dominant",
                Height: "avg",
            },
            table: "olympics",
        },
        viewer1: {
            plugin: "Heatmap",
            title: "Age Distribution by Sport",
            group_by: ["Age"],
            split_by: ["Sport"],
            columns: ["Name"],
            filter: [
                ["Medal", "!=", "NA"],
                ["Age", "is not null", null],
            ],
            sort: [["Name", "col asc"]],
            expressions: {},
            aggregates: {
                Age: "avg",
            },
            table: "olympics",
        },
    },
};

let panel;

window.addEventListener("load", async () => {
    let source = await datasource();
    panel = new DockPanel();
    let workspace = new Workspace(panel);

    DockPanel.attach(panel, document.body);
    workspace.addTable("olympics", source);
    workspace.restore(layout);
});

window.addEventListener("resize", () => {
    if (panel) {
        panel.fit();
    }
});
