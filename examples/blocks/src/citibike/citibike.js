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
import { Workspace } from "@finos/perspective-workspace/dist/esm/perspective-workspace.js";
import { DockPanel } from "@lumino/widgets";

import "@finos/perspective-viewer/dist/esm/perspective-viewer.js";
import "@finos/perspective-viewer-datagrid/dist/esm/perspective-viewer-datagrid.js";
import "@finos/perspective-viewer-openlayers/dist/cdn/perspective-viewer-openlayers.js";
import "@finos/perspective-viewer-d3fc/dist/esm/perspective-viewer-d3fc.js";
import "@finos/perspective-viewer/dist/css/themes.css";
import "@finos/perspective-viewer/dist/css/pro.css"; // TODO: which CSS??
import "@lumino/default-theme/style/index.css";
import "./index.css";

// Quick wrapper function for making a GET call.
function get(url) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "json";
        xhr.onload = () => resolve(xhr.response);
        xhr.send(null);
    });
}

// Fetch feed data from NYC Citibike, if a callback is provided do it again every 1s asynchronously.
async function get_feed(feedname, callback) {
    const url = `https://gbfs.citibikenyc.com/gbfs/en/${feedname}.json`;
    const {
        data: { stations },
        ttl,
    } = await get(url);
    if (typeof callback === "function") {
        callback(stations);
        setTimeout(() => get_feed(feedname, callback), ttl * 1000);
    } else {
        return stations;
    }
}

// Create a new Perspective WebWorker instance.
const worker = perspective.worker();

// Use Perspective WebWorker's table to infer the feed's schema.
async function get_schema(feed) {
    const table = await worker.table(feed);
    const schema = await table.schema();
    table.delete();
    return schema;
}

// Create a superset of the schemas defined by the feeds.
async function merge_schemas(feeds) {
    const schemas = await Promise.all(feeds.map(get_schema));
    return Object.assign({}, ...schemas);
}

async function get_layout() {
    const req = await fetch("layout.json");
    const json = await req.json();
    return json;
}

async function main() {
    const feednames = ["station_status", "station_information"];
    const feeds = await Promise.all(feednames.map(get_feed));
    const schema = await merge_schemas(feeds);

    // Creating a table by joining feeds with an index
    const table = await worker.table(schema, { index: "station_id" });

    // Load the `table` in the `<perspective-viewer>` DOM reference with the initial `feeds`.
    for (let feed of feeds) {
        table.update(feed);
    }

    // Start a recurring async call to `get_feed` and update the `table` with the response.
    get_feed("station_status", table.update);
    const panel = new DockPanel();
    DockPanel.attach(panel, window.content);
    let workspace = new Workspace(panel);
    workspace.addTable("citibike", table);
    const layout = await get_layout();
    workspace.restore(layout);
    window.addEventListener("resize", () => {
        panel.fit();
    });
}

main();
