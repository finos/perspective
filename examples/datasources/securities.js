import perspective from "@finos/perspective";

const worker = perspective.shared_worker();

const SECURITIES = ["AAPL.N", "AMZN.N", "QQQ.N", "NVDA.N", "TSLA.N", "FB.N", "MSFT.N", "TLT.N", "XIV.N", "YY.N", "CSCO.N", "GOOGL.N", "PCLN.N"];

const CLIENTS = ["Homer", "Marge", "Bart", "Lisa", "Maggie", "Moe", "Lenny", "Carl", "Krusty"];

const newRows = () => {
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
};

const getTable = (updating = true) => {
    const table = worker.table(newRows(), {
        index: "name"
    });

    if (updating) {
        const update = () => {
            table.update(newRows());
            setTimeout(update, 500);
        };
        update();
    }

    return table;
};

export const datasource = getTable();
