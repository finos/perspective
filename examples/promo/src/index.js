/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective";
import {PerspectiveWorkspace, PerspectiveWidget} from "@finos/perspective-workspace";
import {Widget} from "@lumino/widgets";
import "@finos/perspective-workspace/src/theme/material/index.less";

import "@finos/perspective-viewer-hypergrid";
import "@finos/perspective-viewer-d3fc";

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
    const table = worker.table(newRows(3000), {limit: 3000});
    const workspace = new PerspectiveWorkspace();
    const widget1 = new PerspectiveWidget("One");

    workspace.addViewer(widget1);

    Widget.attach(workspace, document.body);

    widget1.load(table);

    (function postRow() {
        widget1.table.update(newRows());
        setTimeout(postRow, 50);
    })();

    window.onresize = () => {
        workspace.update();
    };

    window.workspace = workspace;

    window.reset = () => {
        const widgets = workspace.widgets[0].widgets();
        for (let z = widgets.next(); z; z = widgets.next()) {
            if (z !== widget1) {
                z.close();
            }
        }
    };
});
