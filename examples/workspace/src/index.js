/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective";
import "@finos/perspective-workspace";

import "@finos/perspective-viewer-hypergrid";
import "@finos/perspective-viewer-d3fc";

import "./index.less";

const datasource = async () => {
    const req = fetch("./superstore.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const worker = perspective.shared_worker();
    return worker.table(buffer);
};

window.addEventListener("load", async () => {
    const workspace = document.createElement("perspective-workspace");
    document.body.append(workspace);
    workspace.addTable("superstore", await datasource());

    const config = {
        master: {
            widgets: [
                {table: "superstore", name: "Three", "row-pivots": ["State"], columns: ["Sales", "Profit"]},
                {table: "superstore", name: "Four", "row-pivots": ["Category", "Sub-Category"], columns: ["Sales", "Profit"]}
            ]
        },
        detail: {
            main: {
                currentIndex: 0,
                type: "tab-area",
                widgets: [
                    {table: "superstore", name: "One"},
                    {table: "superstore", name: "Two"}
                ]
            }
        }
    };

    workspace.addEventListener("workspace-layout-update", console.log);
    workspace.restore(config);
    window.workspace = workspace;
});
