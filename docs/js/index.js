import perspective from "@finos/perspective";
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import "./logo.js";
import "./concepts.js";

var SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "CSCO.N", "GOOGL.N", "PCLN.N"];
var CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie"];
var id = 0;

function randn_bm() {
    var u = 0,
        v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function newRow() {
    id = id % 100;
    return {
        name: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
        client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)],
        lastUpdate: new Date(),
        chg: randn_bm() * 10,
        bid: randn_bm() * 5 + 95,
        ask: randn_bm() * 5 + 105,
        vol: randn_bm() * 5 + 105,
        id: id++
    };
}

var styleElement = document.createElement("style");
styleElement.innerText = `
.homeContainer perspective-viewer, perspective-viewer {
    box-shadow: none !important;
    overflow: visible !important;
    --plugin--box-shadow:  0 2px 4px 0 rgb(0 0 0 / 10%);
}

.homeContainer perspective-viewer {
    background: none !important;
}`;

document.head.appendChild(styleElement);

var freq = 1,
    freqdir = 1,
    elem;

function update(table) {
    var viewport_height = document.documentElement.clientHeight;
    if (viewport_height - window.scrollY > 0) {
        table.update([newRow(), newRow(), newRow()]);
    }
    if (freq === 0) {
        setTimeout(() => update(table), 3000);
        freqdir = 1;
    } else {
        setTimeout(() => update(table), Math.max(20, 200 / freq));
    }
    if (freq > 60) {
        freqdir = -1;
    }
    freq += freqdir;
}

function select(id) {
    Array.prototype.slice.call(document.querySelectorAll(".buttonWrapper")).map(x => x.classList.remove("selected"));
    document.querySelector(id).classList.add("selected");
    const viewer = document.querySelector("perspective-viewer");
    viewer.restore(
        {
            "#grid": {
                plugin: "datagrid",
                columns: ["ask", "bid", "chg"],
                sort: [
                    ["name", "desc"],
                    ["lastUpdate", "desc"]
                ],
                aggregates: {name: "last", lastUpdate: "last"},
                "row-pivots": ["name", "lastUpdate"],
                "column-pivots": ["client"]
            },
            "#cyclone": {
                columns: ["chg"],
                plugin: "d3_x_bar",
                sort: [["chg", "asc"]],
                "row-pivots": ["name"],
                "column-pivots": ["client"]
            },
            "#pivot": {
                columns: ["vol"],
                plugin: "d3_heatmap",
                sort: [["vol", "asc"]],
                "row-pivots": ["name"],
                "column-pivots": ["client"]
            },
            "#crosssect": {
                plugin: "d3_xy_scatter",
                "row-pivots": ["name"],
                "column-pivots": [],
                columns: ["bid", "ask", "vol", "id"],
                aggregates: {bid: "avg", ask: "avg", vol: "avg"},
                sort: []
            },
            "#intersect": {
                plugin: "d3_treemap",
                "row-pivots": ["name", "client"],
                "column-pivots": [],
                columns: ["bid", "chg"],
                aggregates: {bid: "sum", chg: "low", name: "last"},
                sort: [
                    ["name", "desc"],
                    ["chg", "desc"]
                ]
            },
            "#enhance": {
                plugin: "d3_y_line",
                "row-pivots": [],
                "column-pivots": [],
                sort: [["lastUpdate", "desc"]],
                "column-pivots": ["client"],
                columns: ["bid"],
                aggregates: {bid: "avg", chg: "avg", name: "last"}
            }
        }[id] || {}
    );
}

function get_arrow(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "arrow/superstore.arrow", true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {
        callback(xhr.response);
    };
    xhr.send(null);
}

window.addEventListener("DOMContentLoaded", async function() {
    if (window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
        return;
    }

    var data = [];
    for (var x = 0; x < 100; x++) {
        data.push(newRow());
    }
    elem = Array.prototype.slice.call(document.querySelectorAll("perspective-viewer"))[0];
    var worker = perspective.shared_worker();
    var tbl = await worker.table(data, {index: "id"});
    elem.load(tbl);
    elem.toggleConfig();

    setTimeout(function() {
        update(tbl, 0);
    });

    document.querySelector("#grid").addEventListener("mouseenter", () => select("#grid"));
    document.querySelector("#cyclone").addEventListener("mouseenter", () => select("#cyclone"));
    document.querySelector("#pivot").addEventListener("mouseenter", () => select("#pivot"));
    document.querySelector("#crosssect").addEventListener("mouseenter", () => select("#crosssect"));
    document.querySelector("#intersect").addEventListener("mouseenter", () => select("#intersect"));
    document.querySelector("#enhance").addEventListener("mouseenter", () => select("#enhance"));

    select("#grid");

    get_arrow(async function(arrow) {
        const psp1 = document.querySelector("#demo1 perspective-viewer");
        const tbl1 = await worker.table(arrow.slice());
        psp1.load(tbl1);
        psp1.restore({
            "row-pivots": ["Sub-Category"],
            "column-pivots": ["Segment"],
            columns: ["Sales"],
            plugin: "d3_y_bar"
        });

        const psp2 = document.querySelector("#get_started perspective-viewer");
        const tbl2 = await worker.table(arrow.slice());
        psp2.load(tbl2);
        psp2.toggleConfig();
        psp2.restore({
            plugin: "d3_heatmap",
            "column-pivots": ["Sub-Category"],
            "row-pivots": ["State"],
            sort: [
                ["Sales", "desc"],
                ["Profit", "col desc"]
            ],
            columns: ["Profit"],
            aggregates: {Profit: "low"}
        });
    });
});

window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
        document.querySelector(".logo").style.opacity = 1;
    } else {
        document.querySelector(".logo").style.opacity = 0;
    }
});
