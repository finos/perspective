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

import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@2.7.1/dist/cdn/perspective.js";

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

    // Start a recurring asyn call to `get_feed` and update the `table` with the response.
    get_feed("station_status", table.update);

    window.workspace.tables.set("citibike", Promise.resolve(table));
    const layout = await get_layout();
    window.workspace.restore(layout);
}

main();
