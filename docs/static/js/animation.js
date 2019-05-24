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
    id = id % 1000;
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
    padding: 24px;
    --plugin--box-shadow: 0 5px 5px rgba(0,0,0,.2);
    --d3fc-gradient-full: linear-gradient(#4d342f 0%, #e4521b 22.5%, #feeb65 42.5%, #f0f0f0 50%, #dcedc8 57.5%, #42b3d5 67.5%, #1a237e 100%) !important;
    --d3fc-gradient-positive: linear-gradient(#222222 0%, #1a237e 35%, #42b3d5 70%, #dcedc8 100%) !important;
    --d3fc-gradient-negative: linear-gradient(#feeb65 0%, #e4521b 35%, #4d342f 70%, #222222 100%) !important;
    --highcharts-heatmap-gradient-full: linear-gradient(#feeb65 0%, #e4521b 22.5%, #4d342f 42.5%, #222222 50%, #1a237e 57.5%, #42b3d5 67.5%, #dcedc8 100%) !important;
    --highcharts-heatmap-gradient-positive: linear-gradient(#222222 0%, #1a237e 35%, #42b3d5 70%, #dcedc8 100%) !important;
    --highcharts-heatmap-gradient-negative: linear-gradient(#feeb65 0%, #e4521b 35%, #4d342f 70%, #222222 100%) !important;  
}`;

document.head.appendChild(styleElement);

var freq = 0,
    freqdir = 1,
    elem;

function update() {
    elem.update([newRow(), newRow(), newRow()]);
    if (freq === 0) {
        setTimeout(update, 3000);
        freqdir = 1;
    } else {
        setTimeout(update, Math.max(20, 200 / freq));
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
                view: "hypergrid",
                columns: ["ask", "bid", "chg"],
                sort: [["name", "desc"], ["lastUpdate", "desc"]],
                aggregates: {name: "last", lastUpdate: "last"},
                "row-pivots": ["name", "lastUpdate"],
                "column-pivots": ["client"]
            },
            "#cyclone": {
                columns: ["chg"],
                view: "x_bar",
                sort: [["chg", "asc"]],
                "row-pivots": ["name"],
                "column-pivots": ["client"]
            },
            "#pivot": {
                columns: ["vol"],
                view: "heatmap",
                sort: [["vol", "asc"]],
                "row-pivots": ["name"],
                "column-pivots": ["client"]
            },
            "#crosssect": {
                view: "xy_scatter",
                "row-pivots": ["name"],
                "column-pivots": [],
                columns: ["bid", "ask", "vol", "id"],
                aggregates: {bid: "avg", ask: "avg", vol: "avg"},
                sort: []
            },
            "#intersect": {
                view: "treemap",
                "row-pivots": ["name", "client"],
                "column-pivots": [],
                columns: ["bid", "chg"],
                aggregates: {bid: "avg", chg: "low", name: "last"},
                sort: [["name", "desc"], ["chg", "desc"]]
            },
            "#enhance": {
                view: "y_line",
                "row-pivots": ["lastUpdate"],
                "column-pivots": ["client"],
                columns: ["bid"],
                aggregates: {bid: "avg", chg: "avg", name: "last"},
                sort: []
            }
        }[id] || {}
    );
}

window.addEventListener("WebComponentsReady", function() {
    var data = [];
    for (var x = 0; x < 100; x++) {
        data.push(newRow());
    }
    elem = Array.prototype.slice.call(document.querySelectorAll("perspective-viewer"))[0];
    var worker = elem.worker;
    var tbl = worker.table(data, {index: "id"});
    elem.load(tbl);
    elem._toggle_config();

    setTimeout(function() {
        update(0);
    });

    // setTimeout(function() {
    //     rotate(1);
    // }, 0);

    document.querySelector("#grid").addEventListener("mouseenter", () => select("#grid"));
    document.querySelector("#cyclone").addEventListener("mouseenter", () => select("#cyclone"));
    document.querySelector("#pivot").addEventListener("mouseenter", () => select("#pivot"));
    document.querySelector("#crosssect").addEventListener("mouseenter", () => select("#crosssect"));
    document.querySelector("#intersect").addEventListener("mouseenter", () => select("#intersect"));
    document.querySelector("#enhance").addEventListener("mouseenter", () => select("#enhance"));

    select("#grid");
});

setTimeout(() => {
    document.querySelector(".headerTitle").style.opacity = 0;
});

window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
        document.querySelector(".headerTitle").style.opacity = 1;
    } else {
        document.querySelector(".headerTitle").style.opacity = 0;
    }
});
