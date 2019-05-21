/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const CSV = "https://unpkg.com/@jpmorganchase/perspective-examples@0.2.0-beta.2/build/superstore.csv";
const ARROW = "https://unpkg.com/@jpmorganchase/perspective-examples@0.2.0-beta.2/build/superstore.arrow";

// Run entire test suite

const AGG_OPTIONS = [[{column: "Sales", op: "sum"}], [{column: "State", op: "dominant"}], [{column: "Order Date", op: "dominant"}]];
const COLUMN_PIVOT_OPTIONS = [[], ["Sub-Category"]];
const ROW_PIVOT_OPTIONS = [[], ["State"], ["State", "City"]];
const COLUMN_TYPES = {Sales: "number", "Order Date": "datetime", State: "string"};

const wait_for_perspective = () => new Promise(resolve => window.addEventListener("perspective-ready", resolve));

function to_name({aggregate, row_pivot, column_pivot}) {
    return `${COLUMN_TYPES[aggregate[0].column]},${row_pivot.join("/") || "-"}*${column_pivot.join("/") || "-"}`;
}

async function get_data(worker) {
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

// eslint-disable-next-line no-unused-vars
async function run_test() {
    // eslint-disable-next-line no-undef
    perspective = perspective.default || perspective;

    const suite = new Suite("perspective");
    let worker, data;

    suite.beforeAll(async () => {
        worker = window.perspective.worker();
        await wait_for_perspective();
        data = await get_data(worker);
    });

    suite.description("table()", async () => {
        let table;

        suite.afterEach(async () => {
            await table.delete();
        });

        for (const name of Object.keys(data)) {
            suite.benchmark(name, async () => {
                let test = data[name];
                table = worker.table(test.slice ? test.slice() : test);
                await table.size();
            });
        }
    });

    suite.description("view()", async () => {
        let table;

        suite.beforeAll(async () => {
            table = worker.table(data.arrow.slice());
        });

        suite.afterAll(async () => {
            await table.delete();
        });

        for (const aggregate of AGG_OPTIONS) {
            for (const row_pivot of ROW_PIVOT_OPTIONS) {
                for (const column_pivot of COLUMN_PIVOT_OPTIONS) {
                    const config = {aggregate, row_pivot, column_pivot};

                    suite.description(`view(${to_name(config)}))`, async () => {
                        let view;

                        suite.afterEach(async () => {
                            await view.delete();
                        });

                        suite.benchmark(`view()`, async () => {
                            view = table.view(config);
                            await view.schema();
                        });
                    });

                    suite.description(`to_format(${to_name(config)}))`, async () => {
                        let view;

                        suite.beforeAll(async () => {
                            view = table.view(config);
                            await view.schema();
                        });

                        suite.afterAll(async () => {
                            await view.delete();
                        });

                        for (const format of ["to_json", "to_columns", "to_arrow"]) {
                            suite.benchmark(`${format}()`, async () => {
                                await view[format]();
                            });
                        }
                    });
                }
            }
        }
    });

    return await suite.run();
}
