const perspective = require("@jpmorganchase/perspective").default;

const schema = {
    name: "string",
    client: "string",
    lastUpdate: "date",
    chg: "float",
    bid: "float",
    ask: "float",
    vol: "float",
    id: "integer"
};

var SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"];

var CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];

function generateRow() {
    return {
        name: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
        client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)],
        lastUpdate: new Date(),
        chg: Math.random() * 20 - 10,
        bid: Math.random() * 10 + 90,
        ask: Math.random() * 10 + 100,
        vol: Math.random() * 10 + 100,
        id: Math.floor(Math.random() * 500)
    };
}

const worker = perspective.worker();

const table = worker.table(schema, {index: "id"});

const view = table.view({
    row_pivot: ["name"],
    aggregate: Object.keys(schema).map(col => ({op: "last", column: col}))
});

view.on_update(data => console.table(data));

for (let i = 0; i < 5; i += 1) {
    setTimeout(() => {
        const data = [];
        for (let j = 0; j < i; j += 1) {
            data.push(generateRow());
            table.update(data);
        }
    }, Math.random() * 60);
}
