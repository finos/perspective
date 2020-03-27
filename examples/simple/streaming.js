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

function newRows() {
    var rows = [];
    for (var x = 0; x < 100; x++) {
        rows.push({
            name: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
            client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)],
            lastUpdate: new Date(),
            date: new Date(),
            chg: Math.random() * 20 - 10,
            bid: Math.random() * 10 + 90,
            ask: Math.random() * 10 + 100,
            vol: Math.random() * 10 + 100
        });
    }
    return rows;
}

window.addEventListener("WebComponentsReady", function() {
    var elem = document.getElementsByTagName("perspective-viewer")[0];
    // eslint-disable-next-line no-undef
    var table = perspective.worker().table(
        {
            name: "string",
            client: "string",
            date: "date",
            lastUpdate: "datetime",
            chg: "float",
            bid: "float",
            ask: "float",
            vol: "float"
        },
        {
            limit: 5000
        }
    );
    elem.load(table);

    (function postRow() {
        elem.update(newRows());
        setTimeout(postRow, 50);
    })();
});
