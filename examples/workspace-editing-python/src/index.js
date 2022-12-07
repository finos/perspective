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

import "./index.less";

const URL = "ws://localhost:8080/websocket";

/**
 * `perspective.websocket` allows Perspective in Javascript to access tables
 * and views hosted on a remote server running `perspective.js` or
 * `perspective-python`.
 *
 * The server implementation we will be working with in this example is in
 * `/python/examples/client_server_editing.py`. For an example server
 * in Javascript, see `/examples/remote-express`.
 */
const websocket = perspective.websocket(URL);
const worker = perspective.shared_worker();

/**
 * `open_table` allows you to call API methods on remotely hosted Perspective
 * tables just as you would on a locally created table.
 */
const server_table_promise = websocket.open_table("data_source_one");
let server_view;

// All viewers are based on the same table, which then feed edits back to a
// table on the server with a schema.
let table;

// Keep track of an array of ports. Each new viewer instance creates a new
// port, which is identified by an integer `port_id`.
//
// For code simplicity, we do not track ports by viewer name. Although
// it is trivial to do so, the performance benefits are negligible.
const PORTS = [];

/**
 * Load and return a table, created from a view hosted on the remote server.
 *
 * By calling `to_arrow` ourselves, we bypass some special logic set up when a
 * table is created from a view, and so we can set up `on_update` callbacks in a
 * custom way.
 */
const datasource = async function () {
    const load_start = performance.now();
    const server_table = await server_table_promise;
    server_view = await server_table.view();

    // The API of the remote table/view are symmetric.
    const arrow = await server_view.to_arrow();

    // Create a table in browser memory.
    const table = await worker.table(arrow, { index: "Row ID" });

    // Clears the progress bar and overlay - added for user experience.
    console.log(`Finished load in: ${performance.now() - load_start}`);
    const progress_bar = document.getElementById("progress");
    progress_bar.remove();

    return table;
};

/**
 * After the viewers have been registered to the workspace, set up our
 * `on_update` callbacks that will handle sending edits to the server
 * and receiving updates from the server.
 */
const setup_handlers = async () => {
    const viewers = window.workspace.querySelectorAll("perspective-viewer");
    const client_table = viewers[0].table;
    const client_view = await client_table.view();

    for (const viewer of viewers) {
        PORTS.push(await viewer.getEditPort());
    }

    // Each client instance (i.e. each workspace) needs to get its own unique
    // port from the server. This allows workspaces to differentiate between
    // updates it sends `to` the server, and updates sent `from` the server.
    const server_edit_port = await server_table.make_port();

    // When the client updates, decide whether it is an edit or an update.
    // Edits come through any of the edit ports defined in `PORTS`, so allow
    // those to propagate to the server.
    //
    // Updates back from the server, however, should not be sent `back` to the
    // server (as it would create an infinite loop of updates).
    client_view.on_update(
        (updated) => {
            const client_ports = Object.keys(PORTS).map(
                (viewer) => PORTS[viewer]
            );

            if (client_ports.includes(updated.port_id)) {
                server_table.update(updated.delta, {
                    // Call update using the server port we were given, so that
                    // other workspaces can receive our update.
                    port_id: server_edit_port,
                });
            }
        },
        { mode: "row" }
    );

    // If the server updates, decide whether to apply it to the client table.
    // Use the `server_edit_port` we created earlier - if an update comes
    // through that port, we know that this workspace created it and there is
    // no need to double apply.
    server_view.on_update(
        (updated) => {
            if (updated.port_id !== server_edit_port) {
                // Update on port 0, as that will never trigger a send back to
                // the server.
                client_table.update(updated.delta);
            }
        },
        { mode: "row" }
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

    // `workspace-layout-update` fires every time the layout changes, so we can
    // use it to check if new viewers have been added.
    window.workspace.addEventListener("workspace-layout-update", async () => {
        if (!setup_done) {
            await setup_handlers();
            setup_done = true;
        } else {
            refresh_ports();
        }
    });

    // Register the client-side table we just created.
    window.workspace.tables.set("datasource", Promise.resolve(table));

    // Give the workspace a layout to display.
    window.workspace.restore({
        detail: {
            main: {
                type: "split-area",
                orientation: "horizontal",
                children: [
                    {
                        type: "tab-area",
                        currentIndex: 0,
                        widgets: ["main_widget"],
                    },
                    {
                        type: "tab-area",
                        currentIndex: 0,
                        widgets: ["second_widget"],
                    },
                ],
                sizes: [0.5, 0.5],
            },
        },
        viewers: {
            main_widget: {
                table: "datasource",
                name: "Superstore",
                plugin: "datagrid",
                editable: true,
            },
            second_widget: {
                table: "datasource",
                name: "Superstore 2",
                plugin: "datagrid",
                editable: true,
            },
        },
    });
});
