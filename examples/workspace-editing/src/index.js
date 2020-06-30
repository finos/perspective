/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective";
import "@finos/perspective-viewer-hypergrid";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-workspace";

import "./index.less";

const URL = "ws://localhost:8888/websocket";

const websocket = perspective.websocket(URL);
const worker = perspective.shared_worker();

const server_table = websocket.open_table("data_source_one");
const server_view = websocket.open_view("view_one");

// All viewers are based on the same table, which then feed edits back to a
// table on the server.
let table;

// Keep track of an array of ports. Each new viewer instance creates a new
// port. For code simplicity, we do not track ports by viewer name, although
// it is trivial to do so, and the performance benefits of doing so would be
// negligible, as the `n` in the O(n) search would be number of new viewers
// created in one session.
const PORTS = [];

/**
 * Load and return a table, created from a view hosted on the remote server.
 *
 * By calling `to_arrow` ourselves, we bypass some special logic set up when a
 * table is created from a view, and so we can set up `on_update` callbacks in a
 * custom way.
 */
const datasource = async function() {
    const load_start = performance.now();
    const arrow = await server_view.to_arrow();
    const table = worker.table(arrow, {index: "Row ID"});
    console.log(`Finished load in: ${performance.now() - load_start}`);
    const progress_bar = document.getElementById("progress");
    progress_bar.remove();
    return table;
};

const setup_handlers = async () => {
    // Set up ports based on the viewer configuration - each viewer needs a
    // unique port.
    const viewers = window.workspace.querySelectorAll("perspective-viewer");
    const client_table = viewers[0].table;
    const client_view = client_table.view();

    for (const viewer of viewers) {
        PORTS.push(await viewer.getEditPort());
    }

    // Each client instance (i.e. each workspace) needs to get its own unique
    // port from the server. This allows workspaces to differentiate between
    // updates it sends `to` the server, and updates sent `from` the server.
    const server_edit_port = await server_table.make_port();

    // When the client updates, decide whether it is an edit or an update.
    // Edits come through any of the edit ports defined in `PORTS`, so allow
    // those to propagate to the server. Updates back from the server, however,
    // should not be sent `back` to the server (as it would create an infinite
    // loop of updates).
    client_view.on_update(
        updated => {
            const client_ports = Object.keys(PORTS).map(viewer => PORTS[viewer]);

            if (client_ports.includes(updated.port_id)) {
                server_table.update(updated.delta, {
                    // Call update using the server port we were given, so that
                    // other workspaces can receive our update.
                    port_id: server_edit_port
                });
            }
        },
        {mode: "row"}
    );

    // If the server updates, decide whether to apply it to the client table.
    // Use the `server_edit_port` we created earlier - if an update comes
    // through that port, we know that this workspace created it and there is
    // no need to double apply.
    server_view.on_update(
        updated => {
            if (updated.port_id !== server_edit_port) {
                // Update on port 0, as that will never trigger a send back to
                // the server.
                client_table.update(updated.delta);
            }
        },
        {mode: "row"}
    );
};

/**
 * If new viewers are added, add them to the `PORTS` array. If we chose to track
 * viewers by name, we can also handle viewer deletion. However, this requires
 * viewers to have UNIQUE names, otherwise ports will collide.
 */
const refresh_ports = async () => {
    const viewers = window.workspace.querySelectorAll("perspective-viewer");

    for (const viewer of viewers) {
        const port = await viewer.getEditPort();

        // add new ports
        if (!PORTS.includes(port)) {
            PORTS.push(port);
        }
    }
};

window.addEventListener("load", async () => {
    table = await datasource();

    // On the first layout draw, when all the viewers are ready, initialize
    // our custom on_update handlers.
    let setup_done = false;

    window.workspace.addEventListener("workspace-layout-update", async () => {
        if (!setup_done) {
            await setup_handlers();
            setup_done = true;
        } else {
            refresh_ports();
        }
    });

    window.workspace.tables.set("datasource", table);

    await window.workspace.restore({
        detail: {
            main: {
                type: "split-area",
                orientation: "horizontal",
                children: [
                    {
                        type: "tab-area",
                        currentIndex: 0,
                        widgets: ["main_widget"]
                    },
                    {
                        type: "tab-area",
                        currentIndex: 0,
                        widgets: ["second_widget"]
                    }
                ],
                sizes: [0.5, 0.5]
            }
        },
        viewers: {
            main_widget: {
                table: "datasource",
                name: "Superstore",
                plugin: "hypergrid",
                editable: true
            },
            second_widget: {
                table: "datasource",
                name: "Superstore 2",
                plugin: "hypergrid",
                editable: true
            }
        }
    });
});
