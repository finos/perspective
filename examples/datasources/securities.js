/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require("@finos/perspective");

const worker = perspective.shared_worker ? perspective.shared_worker() : perspective;

// Cache updates for faster update rates (but less data diversity)>
const CACHE_INPUT = false;

// If cached, how many updates to cache?
const CACHE_ENTRIES = 200;

// How many rows per update?
const UPDATE_SIZE = 50;

// Update every N milliseconds
const TICK_RATE = 20;

// Size limit of the server-side table
const TABLE_SIZE = 10000;

const SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"];
const CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];

const __CACHE__ = [];

perspective.initialize_profile_thread();

/*******************************************************************************
 *
 * Slow mode (new rows generated on the fly)
 */

function choose(choices) {
    return choices[Math.floor(Math.random() * choices.length)];
}

function newRows(total_rows) {
    const rows = [];
    for (let x = 0; x < total_rows; x++) {
        rows.push({
            name: choose(SECURITIES),
            client: choose(CLIENTS),
            lastUpdate: new Date(),
            chg: Math.random() * 20 - 10,
            bid: Math.random() * 10 + 90,
            ask: Math.random() * 10 + 100,
            vol: Math.random() * 10 + 100
        });
    }
    return rows;
}

async function init_dynamic({table_size, update_size, tick_rate}) {
    // Create a `table`.
    const table = await worker.table(newRows(table_size), {limit: table_size});

    // The `table` needs to be registered to a name with the Perspective
    // `WebSocketServer` in order for the client to get a proxy handle to it.

    // Loop and update the `table` oocasionally.
    (function postRow() {
        table.update(newRows(update_size));
        setTimeout(postRow, tick_rate);
    })();
    return table;
}

/*******************************************************************************
 *
 * Fast mode (rows pre-generated, cached as Arrows)
 */

async function newArrow(total_rows) {
    const table = await worker.table(newRows(total_rows));
    const vw = await table.view();
    const arrow = await vw.to_arrow();
    vw.delete();
    table.delete();
    return arrow;
}

async function populate_cache(cache_entries) {
    for (let x = 0; x < cache_entries; x++) {
        let arrow = await newArrow();
        __CACHE__[x] = arrow;
    }
}

async function init_cached({table_size, tick_rate, cache_entries}) {
    await populate_cache(cache_entries);
    const table = await worker.table(newRows(table_size), {limit: table_size});
    (function postRow() {
        const entry = __CACHE__[Math.floor(Math.random() * __CACHE__.length)];
        table.update(entry);
        setTimeout(postRow, tick_rate);
    })();
    return table;
}

const getTable = (config = {cached: CACHE_INPUT, tick_rate: TICK_RATE, update_size: UPDATE_SIZE, table_size: TABLE_SIZE, cache_entries: CACHE_ENTRIES}) => {
    if (config.cached) {
        return init_cached(config);
    } else {
        return init_dynamic(config);
    }
};

module.exports = getTable;
