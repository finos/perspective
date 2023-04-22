/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "/perspective.js";

async function load() {
    let resp = await fetch("/superstore-arrow/superstore.arrow");
    let arrow = await resp.arrayBuffer();
    const worker = perspective.worker();
    const table = await worker.table(arrow);
    let workspace = document.getElementById("workspace");
    window.__TABLE__ = table;
    if (workspace) {
        workspace.addTable("superstore", table);
    } else {
        window.__TABLE__ = table;
    }
}

await load();
