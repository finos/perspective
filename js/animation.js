
var SECURITIES = [
    "AAPL.N",
    "AMZN.N",
    "QQQ.N",
    "NVDA.N",
    "TSLA.N",
    "FB.N",
    "MSFT.N",
    "CSCO.N",
    "GOOGL.N",
    "PCLN.N"
];
var CLIENTS = [
    "Homer",
    "Marge",
    "Bart",
    "Lisa",
    "Maggie"
];
var id = 0;
function newRow() {
    id = id % 100;
    return {
        name: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
        client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)], 
        lastUpdate: new Date(),
        chg: Math.random() * 20 - 10,
        bid: Math.random() * 10 + 90,
        ask: Math.random() * 10 + 100,
        vol: Math.random() * 10 + 100,                    
        id: id++
    };
}

var PHASES = ['a', 'b', 'c'];
var CONFIGS = [{
    view: 'y_bar',
    'row-pivots': '["name"]',
    'column-pivots': '[]',
    aggregates: '{"bid":"sum"}',
    columns: '["bid"]',
    sort: '[]'
}, {
    view: 'xy_scatter',
    'row-pivots': '["name"]',
    'column-pivots': '[]',
    columns: '["bid", "ask", "vol", "id"]',
    aggregates: '{"bid":"avg","ask":"avg", "vol":"avg"}',
    sort: '[]'
}, {
    view: 'x_bar',
    'row-pivots': '["name"]',
    'column-pivots': '["client"]',
    aggregates: '{"chg":"sum"}',
    columns: '["chg"]',
    sort: '[]'
}, {
    view: 'xy_line',
    'row-pivots': '[]',
    'column-pivots': '["name"]',
    columns: '["lastUpdate", "bid"]',
    sort: '[["lastUpdate","asc"]]'
}, {
    view: 'hypergrid',
    'row-pivots': '["name"]',
    'column-pivots': '["client"]',
    columns: '["bid", "chg"]',
    sort: '[]'
}, {
    view: 'hypergrid',
    'row-pivots': '[]',
    'column-pivots': '[]',
    columns: '["name", "chg", "lastUpdate", "bid", "ask", "client", "vol", "id"]',
    sort: '[["lastUpdate","asc"]]'
}, {
    view: 'sunburst',
    'row-pivots': '["name","client"]',
    'column-pivots': '[]',
    columns: '["ask", "chg"]',
    sort: '[["chg","asc"]]'
}, {
    view: 'treemap',
    'row-pivots': '["name","client"]',
    'column-pivots': '[]',
    columns: '["bid", "chg"]',
    sort: '[["lastUpdate","asc"]]'
}];

var last_index = 5, widget;

function rotate(next_index) {
    widget = Array.prototype.slice.call(document.querySelectorAll('perspective-viewer'))[0];   
    if (!next_index) { 
        while (!next_index || last_index === next_index) {
            next_index = Math.floor(Math.random() * CONFIGS.length);
        }
    }
    last_index = next_index;

    var config = CONFIGS[next_index];
    for (var key in config) {
        widget.setAttribute(key, config[key]);
    }
    setTimeout(rotate, 10000);
}

var tbl;
function update() {
    tbl.update([newRow(), newRow(), newRow()]);
    setTimeout(update, 500);
}

window.addEventListener('WebComponentsReady', function () {
    var data = [];
    for (var x = 0; x < 100; x ++) {
        data.push(newRow());
    }
    var elems = Array.prototype.slice.call(document.querySelectorAll('perspective-viewer'));
    worker = elems[0].worker;
    tbl = worker.table(data, {index: "id"});
    elems[0].load(tbl);
    elems[0]._toggle_config();
    setTimeout(function () {update(0); });
    setTimeout(function () {rotate(1);}, 0);
});
