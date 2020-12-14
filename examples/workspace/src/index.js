/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-workspace";

import "./index.less";

const datasource = async () => {
    const req = fetch("./superstore.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const worker = perspective.shared_worker();
    return await worker.table(buffer);
};

const DEFAULT_LAYOUT = {
    master: {
        widgets: ["Four", "Three"]
    },
    detail: {
        main: {
            currentIndex: 0,
            type: "tab-area",
            widgets: ["One", "Two"]
        }
    },
    viewers: {
        One: {table: "superstore", editable: true},
        Three: {table: "superstore", name: "Test Widget III (modified)", "row-pivots": ["State"], columns: ["Sales", "Profit"]},
        Four: {table: "superstore", name: "Test Widget IV (modified)", "row-pivots": ["Category", "Sub-Category"], columns: ["Sales", "Profit"]}
    }
};

window.addEventListener("load", () => {
    window.workspace.tables.set("superstore", datasource());

    const savedLayout = localStorage.getItem("layout");

    window.workspace.restore(savedLayout ? JSON.parse(savedLayout) : DEFAULT_LAYOUT);
    // window.workspace.restore(DEFAULT_LAYOUT);

    window.workspace.addEventListener("workspace-layout-update", () => {
        localStorage.setItem("layout", JSON.stringify(window.workspace.save()));
    });
});
