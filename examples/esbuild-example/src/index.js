/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective/dist/esm/perspective.js";

import "@finos/perspective-viewer/dist/esm/perspective-viewer.js";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import "@finos/perspective-viewer/dist/css/material-dark.css";

import "./index.css";

import arrow from "superstore-arrow/superstore.arrow";
const req = fetch(arrow);
const worker = perspective.shared_worker();

window.addEventListener("DOMContentLoaded", async () => {
    const viewer = document.createElement("perspective-viewer");
    document.body.append(viewer);

    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const table = worker.table(buffer);
    viewer.load(table);

    window.viewer = viewer;
});
