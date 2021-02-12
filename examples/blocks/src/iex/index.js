const PUB_TOKEN = "Tpk_ecc89ddf30a611e9958142010a80043c";
const IEX_URL = "https://sandbox.iexapis.com/beta/stock/";
const QUERY1 = "/chart?token=" + PUB_TOKEN;
const QUERY2 = "/stats?token=" + PUB_TOKEN;
const QUERY3 = "/balance-sheet?token=" + PUB_TOKEN;

const worker = perspective.shared_worker();

const TABLES = new Map();

async function run(input, string, wrap = false, index = null) {
    const req = await fetch(IEX_URL + input.value + string);
    let data = await req.json();
    if (index) {
        data = data[index];
    }
    if (wrap) {
        data = [data];
    }
    let table;
    if (TABLES.has(string)) {
        table = TABLES.get(string);
        table.clear();
        table.update(data);
    } else {
        table = await worker.table(data);
        TABLES.set(string, table);
    }
    return table;
}

async function get_layout() {
    const req = await fetch("layout.json");
    const json = await req.json();
    return json;
}

window.addEventListener("WebComponentsReady", async function() {
    const workspace = document.getElementsByTagName("perspective-workspace")[0];
    const input = document.getElementById("ticker");

    input.addEventListener("keydown", async ev => {
        input.style.color = "inherit";
        if (ev.keyCode === 13) {
            try {
                await run(input, QUERY1);
                await run(input, QUERY2, true);
                await run(input, QUERY3, false, "balancesheet");
            } catch (e) {
                input.style.color = "red";
            }
        }
    });

    workspace.addTable("query1", run(input, QUERY1));
    workspace.addTable("query2", run(input, QUERY2, true));
    workspace.addTable("query3", run(input, QUERY3, false, "balancesheet"));

    const to_span = x => `<span style='color:#666'>${x}</span>`;

    workspace.addEventListener("perspective-datagrid-after-update", event => {
        const form = new Intl.NumberFormat("en-us", {});
        const datagrid = event.detail;
        for (const td of datagrid.get_tds()) {
            const metadata = datagrid.get_meta(td);
            if (metadata.column.endsWith("Percent")) {
                td.innerHTML = form.format(Math.round(metadata.value * 100)) + to_span(" %");
            } else if (metadata.type === "float" && (metadata.value < -1000000 || metadata.value > 1000000)) {
                td.innerHTML = form.format(Math.round(metadata.value / 1000000)) + to_span(" mm");
            }
        }
    });

    const json = await get_layout();
    workspace.restore(json);
});
