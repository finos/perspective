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
import "!!style-loader!css-loader!less-loader!../src/index.less";

const datasource = async () => {
    const req = fetch("./superstore.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const worker = perspective.shared_worker();
    return worker.table(buffer);
};

window.addEventListener("WebComponentsReady", async () => {
    const workspace = document.createElement("perspective-workspace");
    document.body.appendChild(workspace);

    const table = datasource();
    workspace.tables.set("superstore", table);

    workspace.restore({
        master: {
            widgets: ["Four", "Five"]
        },
        detail: {
            main: {
                orientation: "vertical",
                type: "split-area",
                children: [
                    {
                        type: "tab-area",
                        widgets: ["Three"]
                    },
                    {
                        type: "split-area",
                        orientation: "horizontal",
                        children: [
                            {
                                type: "tab-area",
                                widgets: ["One"]
                            },
                            {
                                type: "tab-area",
                                widgets: ["Two"]
                            }
                        ]
                    }
                ]
            }
        },
        viewers: {
            One: {table: "superstore", name: "Test Widget One", "row-pivots": ["State"], columns: ["Sales", "Profit"]},
            Two: {table: "superstore", name: "Test Table Two", plugin: "d3_treemap", columns: ["Sales", "Profit"], "row-pivots": ["Category", "Sub-Category", "Segment"]},
            Three: {table: "superstore", name: "Test Widget Three"},
            Four: {table: "superstore", name: "Test Widget IV (modified)", "row-pivots": ["State"], columns: ["Sales", "Profit"]},
            Five: {table: "superstore", name: "Test Widget V (modified)", "row-pivots": ["Category", "Sub-Category"], columns: ["Sales", "Profit"]}
        }
    });
});
