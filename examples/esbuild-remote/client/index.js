// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import perspective from "@finos/perspective/dist/esm/perspective.js";

import "@finos/perspective-viewer/dist/esm/perspective-viewer.js";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import "@finos/perspective-viewer/dist/css/pro-dark.css";

import "./index.css";

window.addEventListener("DOMContentLoaded", async () => {
    const viewer = document.createElement("perspective-viewer");
    document.body.append(viewer);

    // Create two perspective interfaces, one remotely via WebSocket,
    // and one local via WebWorker.
    const url = `${window.location.origin.replace("http", "ws")}/subscribe`;
    const websocket = perspective.websocket(url);
    const worker = perspective.worker();

    // Open a `Table` that is hosted on the server. All instructions
    // will be proxied to the server `Table` - no calculations are
    // done on the client.
    const remote_table = await websocket.open_table("remote_table");
    const view = await remote_table.view();

    // Create a `table` from this, owned by the local WebWorker.
    // Data is transferred from `view` to the local WebWorker, both
    // the current state and all future updates, as Arrows.
    const local_table = await worker.table(view, { limit: 10000 });

    // Load this in the `<perspective-viewer>`.
    viewer.load(local_table);
});
