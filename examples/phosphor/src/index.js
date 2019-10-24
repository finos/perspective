/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective";
import {PerspectiveWorkspace, PerspectiveWidget} from "@finos/perspective-phosphor";
import {Widget} from "@phosphor/widgets";
import "@finos/perspective-phosphor/src/theme/vaporwave/index.less";

import "@finos/perspective-viewer-hypergrid";
import "@finos/perspective-viewer-d3fc";

import "./style/index.less";

const worker = perspective.shared_worker();
const req = fetch("./superstore.arrow");

window.addEventListener("load", async () => {
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const table = worker.table(buffer);

    const workspace = new PerspectiveWorkspace();

    const widget1 = new PerspectiveWidget("One", {
        "row-pivots": ["Sub-Category"],
        columns: ["Profit", "Sales"]
    });

    const widget2 = new PerspectiveWidget("Two", {
        plugin: "d3_x_bar",
        "row-pivots": ["Region"],
        columns: ["Region"]
    });

    const widget3 = new PerspectiveWidget("Three");
    const widget4 = new PerspectiveWidget("Four");

    workspace.addViewer(widget1);
    workspace.addViewer(widget2, {mode: "split-bottom", ref: widget1});
    workspace.addViewer(widget3, {mode: "split-right", ref: widget1});
    workspace.addViewer(widget4, {mode: "split-right", ref: widget2});

    Widget.attach(workspace, document.body);

    widget1.load(table);
    widget2.load(table);
    widget3.load(table);
    widget4.load(table);

    window.onresize = () => {
        workspace.update();
    };

    window.workspace = workspace;

});
