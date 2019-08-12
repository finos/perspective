/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const WORKER = window.perspective.worker({
    types: {
        notional: {
            type: "float",
            aggregate: "avg",
            format: {
                style: "decimal",
                minimumFractionDigits: 0,
                maximumFractionDigits: 4
            }
        }
    }
});

const SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N", "AMD.N", "QQQ.N", "ZNGA.N", "NVDA.N"];

const CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];

function newRows() {
    const rows = [];
    for (let x = 0; x < 5; x++) {
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

const SCHEMA = {
    name: "string",
    client: "string",
    lastUpdate: "datetime",
    chg: "notional",
    bid: "notional",
    ask: "notional",
    vol: "float"
};

function throttle(f) {
    let task;
    return function() {
        if (!task) {
            task = true;
            setTimeout(() => {
                f();
                task = false;
            }, 200);
        }
    };
}

const heat_colors = () =>
    `
--hypergrid--background: hsl(${window.color3.value}, 80%, 30%);
--hypergrid-header--background: hsl(${window.color3.value}, 80%, 30%);
--notional--hypergrid-positive--background: hsl(${window.color.value}, 80%, 30%);
--notional--hypergrid-negative--background: hsl(${window.color2.value}, 80%, 30%);
`.trim();

window.addEventListener("WebComponentsReady", function() {
    const elem = document.getElementsByTagName("perspective-viewer")[0];

    const throttle_restyle = throttle(() => {
        elem.setAttribute("style", heat_colors());
        elem.restyleElement();
    });

    window.color.addEventListener("input", throttle_restyle);
    window.color2.addEventListener("input", throttle_restyle);
    window.color3.addEventListener("input", throttle_restyle);

    throttle_restyle();

    // eslint-disable-next-line no-undef
    const tbl = WORKER.table(SCHEMA, {
        limit: 500
    });
    (function postRow() {
        tbl.update(newRows());
        setTimeout(postRow, 100);
    })();
    elem.load(tbl);
});
