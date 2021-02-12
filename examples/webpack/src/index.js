/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective";

import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import "@finos/perspective-viewer/dist/umd/material.css";

import "./index.css";

const worker = perspective.shared_worker();

// superstore.arrow located in node_modules/superstore-arrow/ and it's
// configured by 'devServer' in 'webpack.config.js'
const req = fetch("./superstore.arrow");

window.addEventListener("load", async () => {
    const viewer = document.createElement("perspective-viewer");
    document.body.append(viewer);

    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const table = await worker.table(buffer);

    viewer.load(table);

    window.viewer = viewer;
});
