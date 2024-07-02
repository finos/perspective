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

import perspective from "@finos/perspective";

import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import "@finos/perspective-viewer/dist/css/pro-dark.css";

import "./index.css";

const viewer = document.createElement("perspective-viewer");
document.body.append(viewer);

// Create two perspective interfaces, one remotely via WebSocket,
// and one local via WebWorker.
const url = `${window.location.origin.replace("http", "ws")}/ws`;
// const url = `ws://localhost:8080/`;
const websocket = await perspective.websocket(url);
const worker = await perspective.worker();

// Open a `Table` that is hosted on the server. All instructions
// will be proxied to the server `Table` - no calculations are
// done on the client.
const remote_table = await websocket.open_table("Benchmarks");
console.log("remote_table", remote_table);
console.log("remote_table.schema()", await remote_table.schema());
// const view = await remote_table.view();

// Create a `table` from this, owned by the local WebWorker.
// Data is transferred from `view` to the local WebWorker, both
// the current state and all future updates, as Arrows.
// const local_table = await worker.table(view, { limit: 10000 });

// Load this in the `<perspective-viewer>`.
viewer.load(remote_table);

const xyScatter = {
    version: "2.10.0",
    plugin: "X/Y Scatter",
    plugin_config: {
        zoom: {
            k: 1.3947436663504058,
            x: -367.506353372228,
            y: -168.55554553162324,
        },
    },
    columns_config: {},
    settings: true,
    theme: "Pro Dark",
    title: null,
    group_by: [],
    split_by: [],
    columns: ["ts", "timing", "name", null, null, null, null],
    filter: [],
    sort: [],
    expressions: { Count: "1" },
    aggregates: {},
};

const aggregateTiming = {
    version: "2.10.0",
    plugin: "Datagrid",
    plugin_config: {
        columns: { __ROW_PATH__: { column_size_override: 107.125 } },
        editable: false,
        scroll_lock: false,
    },
    columns_config: {},
    settings: true,
    theme: "Pro Dark",
    title: null,
    group_by: ["name", "version"],
    split_by: [],
    columns: ["timing", "Count"],
    filter: [],
    sort: [],
    expressions: { Count: "1" },
    aggregates: { timing: "avg" },
};

viewer.restore(xyScatter);
