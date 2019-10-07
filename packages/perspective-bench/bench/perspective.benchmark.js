/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/******************************************************************************
 *
 * Constants
 *
 */

const CSV = "https://unpkg.com/@jpmorganchase/perspective-examples@0.2.0-beta.2/build/superstore.csv";
const ARROW = "https://unpkg.com/@jpmorganchase/perspective-examples@0.2.0-beta.2/build/superstore.arrow";

const AGG_OPTIONS = [[{column: "Sales", op: "sum"}], [{column: "State", op: "dominant"}], [{column: "Order Date", op: "dominant"}]];
const COLUMN_PIVOT_OPTIONS = [[], ["Sub-Category"]];
const ROW_PIVOT_OPTIONS = [[], ["State"], ["State", "City"]];
const COLUMN_TYPES = {Sales: "number", "Order Date": "datetime", State: "string"};

/******************************************************************************
 *
 * Perspective.js Benchmarks
 *
 */

PerspectiveBench.setIterations(100);
PerspectiveBench.setTimeout(2000);
PerspectiveBench.setToss(5);

let worker, data;

beforeAll(async () => {
    await load_dynamic_browser("perspective", PerspectiveBench.commandArg(0));
    window.perspective = window.perspective.default || window.perspective;
    worker = window.perspective.worker();
    await wait_for_perspective();
    if (typeof module !== "undefined" && module.exports) {
        data = await get_data_node(worker);
    } else {
        data = await get_data_browser(worker);
    }
});

describe("Table", async () => {
    let table;

    afterEach(async () => {
        await table.delete();
    });

    for (const name of Object.keys(data)) {
        describe(name, () => {
            benchmark("table()", async () => {
                let test = data[name];
                table = worker.table(test.slice ? test.slice() : test);
                await table.size();
            });
        });
    }
});

describe("View", async () => {
    let table;

    beforeAll(async () => {
        table = worker.table(data.arrow.slice());
    });

    afterAll(async () => {
        await table.delete();
    });

    for (const aggregate of AGG_OPTIONS) {
        for (const row_pivot of ROW_PIVOT_OPTIONS) {
            for (const column_pivot of COLUMN_PIVOT_OPTIONS) {
                const config = {aggregate, row_pivot, column_pivot};

                describe(to_name(config), async () => {
                    let view;

                    afterEach(async () => {
                        await view.delete();
                    });

                    benchmark(`view()`, async () => {
                        view = table.view(config);
                        await view.schema();
                    });
                });

                describe(to_name(config), async () => {
                    let view;

                    beforeAll(async () => {
                        view = table.view(config);
                        await view.schema();
                    });

                    afterAll(async () => {
                        await view.delete();
                    });

                    for (const format of ["to_json", "to_columns", "to_arrow"]) {
                        benchmark(`${format}()`, async () => {
                            await view[format]();
                        });
                    }
                });
            }
        }
    }
});

/******************************************************************************
 *
 * Utils
 *
 */

const wait_for_perspective = () => new Promise(resolve => window.addEventListener("perspective-ready", resolve));

function to_name({aggregate, row_pivot, column_pivot}) {
    const type = COLUMN_TYPES[aggregate[0].column];
    const sides = {
        "00": "0 Sided",
        "10": "1 Sided",
        "20": "1 Sided (Deep)",
        "21": "2 Sided (Deep)",
        "11": "2 Sided",
        "01": "2 Sided (Column Only)"
    }[row_pivot.length.toString() + column_pivot.length.toString()];
    return `${sides}, ${type}`;
    //    return `${COLUMN_TYPES[aggregate[0].column]},${row_pivot.join("/") || "-"}*${column_pivot.join("/") || "-"}`;
}

const load_dynamic_node = name => {
    return new Promise(resolve => {
        window.perspective = require("@finos/perspective");
        resolve();
    });
};

const load_dynamic_browser = (name, url) => {
    return new Promise(resolve => {
        const existingScript = document.getElementById(name);
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = url; // URL for the third-party library being loaded.
            script.id = name; // e.g., googleMaps or stripe
            document.body.appendChild(script);
            script.onload = () => {
                if (resolve) resolve();
            };
        } else {
            resolve();
        }
    });
};

async function get_data_browser(worker) {
    const req1 = fetch(CSV);
    const req2 = fetch(ARROW);

    console.log("Downloading CSV");
    let content = await req1;
    const csv = await content.text();

    console.log("Downloading Arrow");
    content = await req2;
    const arrow = await content.arrayBuffer();

    console.log("Generating JSON");
    const tbl = worker.table(arrow.slice());
    const view = tbl.view();
    const rows = await view.to_json();
    const columns = await view.to_columns();
    view.delete();
    tbl.delete();

    return {csv, arrow, rows, columns};
}

async function get_data_node(worker) {
    const fs = require("fs");
    const path = require("path");

    const ARROW_FILE = path.resolve(__dirname, "../../../../examples/simple/superstore.arrow");
    console.log("Loading Arrow");
    const arrow = fs.readFileSync(ARROW_FILE, null).buffer;

    console.log("Generating JSON");
    const tbl = worker.table(arrow.slice());
    const view = tbl.view();
    const rows = await view.to_json();
    const columns = await view.to_columns();
    const csv = await view.to_csv();
    view.delete();
    tbl.delete();

    return {csv, arrow, rows, columns};
}
