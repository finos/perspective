/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketHost, table, initialize_profile_thread} = require("@finos/perspective");

/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"];
var CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];
var CACHE_INPUT = false;
var CACHE_ENTRIES = 200;
var TABLE_SIZE = 10000;
var UPDATE_SIZE = 50;
var TICK_RATE = 20;

var __CACHE__ = [];

initialize_profile_thread();

function newRows() {
    var rows = [];
    for (var x = 0; x < UPDATE_SIZE; x++) {
        rows.push({
            name: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
            client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)],
            lastUpdate: new Date(),
            chg: Math.random() * 20 - 10,
            bid: Math.random() * 10 + 90,
            ask: Math.random() * 10 + 100,
            vol: Math.random() * 10 + 100
        });
    }
    return rows;
}

async function newArrow() {
    var tbl = table(newRows());
    var vw = tbl.view();
    var arrow = await vw.to_arrow();
    vw.delete();
    tbl.delete();
    return arrow;
}

const host = new WebSocketHost({assets: [__dirname]});

async function init() {
    if (CACHE_INPUT) {
        for (let x = 0; x < CACHE_ENTRIES; x++) {
            let arrow = await newArrow();
            __CACHE__[x] = arrow;
        }
    }
    var tbl = table(CACHE_INPUT ? __CACHE__[0] : newRows(), {
        limit: TABLE_SIZE
    });
    host.host_view("data_source_one", tbl.view());
    (function postRow() {
        if (CACHE_INPUT) {
            const entry = __CACHE__[Math.floor(Math.random() * __CACHE__.length)];
            tbl.update(entry);
        } else {
            tbl.update(newRows());
        }
        setTimeout(postRow, TICK_RATE);
    })();
}

init();
