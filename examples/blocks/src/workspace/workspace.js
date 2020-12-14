/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const datasource = async () => {
    const req = fetch("./superstore.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    const worker = window.perspective.shared_worker();
    return await worker.table(buffer);
};

window.addEventListener("WebComponentsReady", async function() {
    const workspace = document.getElementsByTagName("perspective-workspace")[0];
    workspace.addTable("superstore", await datasource());

    const config = {
        detail: {
            main: {
                currentIndex: 0,
                type: "tab-area",
                widgets: [{table: "superstore"}]
            }
        }
    };
    workspace.restore(config);
});
