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
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import "@finos/perspective-workspace/dist/umd/material.css";

import "./style/index.less";

import SYMBOLS from "./symbols.json";

const worker = perspective.shared_worker();

var CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];

const choose = x => x[Math.floor(Math.random() * x.length)];
const date = (() => {
    const start = new Date();
    let x = 0;
    return () => {
        x += 10;
        return new Date(+start + x);
    };
})();

function newRows(n = 5) {
    var rows = [];
    for (var x = 0; x < n; x++) {
        const ticker = choose(SYMBOLS.slice(50));
        rows.push({
            client: choose(CLIENTS),
            bid: Math.random() * 10 + 90,
            ask: Math.random() * 10 + 100,
            lastUpdate: date(),
            chg: Math.random() * 20 - 10,
            vol: Math.random() * 10 + 100,
            symbol: ticker.symbol,
            name: ticker.name
        });
    }
    return rows;
}

window.addEventListener("load", async () => {
    const table = await worker.table(newRows(3000), {limit: 3000});
    const workspace = document.createElement("perspective-workspace");
    document.body.appendChild(workspace);
    workspace.tables.set("rtdata", table);

    const viewer = document.createElement("perspective-viewer");
    viewer.setAttribute("slot", "One");
    workspace.appendChild(viewer);

    workspace.restore({
        detail: {
            main: {
                currentIndex: 0,
                type: "tab-area",
                widgets: ["One"]
            }
        },
        viewers: {
            One: {table: "rtdata"}
        }
    });

    (function postRow() {
        table.update(newRows());
        setTimeout(postRow, 50);
    })();

    window.onresize = () => {
        workspace.notifyResize();
    };

    //window.workspace = workspace;

    window.reset = () => {
        const widgets = workspace.querySelectorAll("perspective-viewer");
        for (let z of widgets) {
            if (z !== viewer) {
                workspace.removeChild(z);
            }
        }
    };
});
