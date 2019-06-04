/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require("@finos/perspective");

// Cache updates for faster update rates (but less data diversity)>
var CACHE_INPUT = false;

// If cached, how many updates to cache?
var CACHE_ENTRIES = 200;

// How many rows per update?
var UPDATE_SIZE = 50;

// Update every N milliseconds
var TICK_RATE = 20;

// Size limit of the server-side table
var TABLE_SIZE = 10000;

var SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"];
var CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];

var __CACHE__ = [];

perspective.initialize_profile_thread();

/*******************************************************************************
 *
 * Slow mode (new rows generated on the fly)
 */

function choose(choices) {
    return choices[Math.floor(Math.random() * choices.length)];
}

function newRows(total_rows = UPDATE_SIZE) {
    var rows = [];
    for (var x = 0; x < total_rows; x++) {
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

async function init_dynamic() {
    // Create a `table`.
    const table = perspective.table(newRows(TABLE_SIZE), {limit: TABLE_SIZE});

    // The `table` needs to be registered to a name with the Perspective
    // `WebSocketServer` in order for the client to get a proxy handle to it.
    host.host_view("data_source_one", table.view());

    // Loop and update the `table` oocasionally.
    (function postRow() {
        table.update(newRows());
        setTimeout(postRow, TICK_RATE);
    })();
}

/*******************************************************************************
 *
 * Fast mode (rows pre-generated, cached as Arrows)
 */

async function newArrow(total_rows) {
    var table = perspective.table(newRows(total_rows));
    var vw = table.view();
    var arrow = await vw.to_arrow();
    vw.delete();
    table.delete();
    return arrow;
}

async function populate_cache() {
    for (let x = 0; x < CACHE_ENTRIES; x++) {
        let arrow = await newArrow();
        __CACHE__[x] = arrow;
    }
}

async function init_cached() {
    await populate_cache();
    const tbl = perspective.table(newRows(TABLE_SIZE), {limit: TABLE_SIZE});
    host.host_view("data_source_one", tbl.view());
    (function postRow() {
        const entry = __CACHE__[Math.floor(Math.random() * __CACHE__.length)];
        tbl.update(entry);
        setTimeout(postRow, TICK_RATE);
    })();
}

/*******************************************************************************
 *
 * Main
 */

const host = new perspective.WebSocketServer({assets: [__dirname]});

if (CACHE_INPUT) {
    init_cached();
} else {
    init_dynamic();
}
