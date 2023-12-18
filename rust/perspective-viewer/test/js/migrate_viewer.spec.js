// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { test, expect } from "@finos/perspective-test";
import {
    compareContentsToSnapshot,
    API_VERSION,
} from "@finos/perspective-test";

const { convert } = require("../../dist/cjs/migrate.js");

async function get_contents(page) {
    return await page.evaluate(async () => {
        const plugin = document.querySelector("perspective-viewer").children[0];
        if (plugin.tagName === "PERSPECTIVE-VIEWER-DATAGRID") {
            return plugin?.shadowRoot.innerHTML || "MISSING";
        } else {
            return (
                plugin?.shadowRoot?.querySelector("#container")?.innerHTML ||
                "MISSING"
            );
        }
    });
}

const TESTS = [
    [
        "Bucket by year",
        {
            columns: ["Sales"],
            plugin: "d3_y_area",
            "computed-columns": ['month_bucket("Order Date")'],
            "row-pivots": ["month_bucket(Order Date)"],
            "column-pivots": ["Ship Mode"],
            filters: [["Category", "==", "Office Supplies"]],
            selectable: null,
            editable: null,
            aggregates: null,
            sort: null,
            plugin_config: {},
        },
        {
            version: API_VERSION,
            plugin: "Y Area",
            plugin_config: {},
            group_by: ["bucket(\"Order Date\", 'M')"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
            filter: [["Category", "==", "Office Supplies"]],
            sort: [],
            expressions: {
                "bucket(\"Order Date\", 'M')": "bucket(\"Order Date\", 'M')",
            },
            aggregates: {},
            title: null,
        },
    ],
    [
        "Plugin config color mode",
        {
            columns: ["Sales"],
            plugin: "datagrid",
            "computed-columns": [],
            "row-pivots": [],
            "column-pivots": [],
            filters: [],
            selectable: null,
            editable: null,
            aggregates: null,
            sort: null,
            plugin_config: { Sales: { color_mode: "gradient", gradient: 10 } },
        },
        {
            version: API_VERSION,
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Sales: { number_bg_mode: "gradient", bg_gradient: 10 },
                },
                editable: false,
                scroll_lock: true,
            },
            group_by: [],
            split_by: [],
            columns: ["Sales"],
            filter: [],
            sort: [],
            expressions: {},
            aggregates: {},
            title: null,
        },
    ],
    [
        "New Datagrid style API",
        {
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Sales: { number_color_mode: "gradient", gradient: 10 },
                },
                editable: false,
                scroll_lock: true,
            },
            group_by: [],
            split_by: [],
            columns: ["Sales"],
            filter: [],
            sort: [],
            expressions: {},
            aggregates: {},
        },
        {
            version: API_VERSION,
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Sales: {
                        bg_gradient: 10,
                        number_bg_mode: "gradient",
                    },
                },
                editable: false,
                scroll_lock: true,
            },
            group_by: [],
            split_by: [],
            columns: ["Sales"],
            filter: [],
            sort: [],
            expressions: {},
            aggregates: {},
            title: null,
        },
    ],
    [
        "New Datagrid style API with a bar and gradient",
        {
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Sales: {
                        number_color_mode: "bar",
                        gradient: 10,
                        pos_color: "#115599",
                        neg_color: "#115599",
                    },
                },
                editable: false,
                scroll_lock: true,
            },
            group_by: [],
            split_by: [],
            columns: ["Sales"],
            filter: [],
            sort: [],
            expressions: {},
            aggregates: {},
        },
        {
            version: API_VERSION,
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Sales: {
                        fg_gradient: 10,
                        number_fg_mode: "bar",
                        neg_fg_color: "#115599",
                        pos_fg_color: "#115599",
                    },
                },
                editable: false,
                scroll_lock: true,
            },
            group_by: [],
            split_by: [],
            columns: ["Sales"],
            filter: [],
            sort: [],
            expressions: {},
            aggregates: {},
            title: null,
        },
    ],
    [
        "New API, reflexive (new API is unmodified)",
        {
            version: API_VERSION,
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Discount: {
                        neg_bg_color: "#780aff",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#f5ac0f",
                    },
                    Profit: {
                        neg_bg_color: "#f50fed",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#32cd82",
                    },
                    Sales: {
                        neg_bg_color: "#f5ac0f",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#780aff",
                    },
                },
                editable: false,
                scroll_lock: true,
            },
            columns: [
                "Category",
                "Sales",
                "Discount",
                "Profit",
                "Sub-Category",
                "Order Date",
            ],
            sort: [["Sub-Category", "desc"]],
            aggregates: {},
            filter: [],
            group_by: [],
            expressions: {},
            split_by: [],
            title: null,
        },
        {
            version: API_VERSION,
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Discount: {
                        neg_bg_color: "#780aff",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#f5ac0f",
                    },
                    Profit: {
                        neg_bg_color: "#f50fed",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#32cd82",
                    },
                    Sales: {
                        neg_bg_color: "#f5ac0f",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#780aff",
                    },
                },
                editable: false,
                scroll_lock: true,
            },
            columns: [
                "Category",
                "Sales",
                "Discount",
                "Profit",
                "Sub-Category",
                "Order Date",
            ],
            sort: [["Sub-Category", "desc"]],
            aggregates: {},
            filter: [],
            group_by: [],
            expressions: {},
            split_by: [],
            title: null,
        },
    ],
    [
        "From 0.0.0",
        {
            plugin: "X/Y Scatter",
            plugin_config: {
                columns: {
                    Region: { symbols: [{ key: "Central", value: "circle" }] },
                },
            },
            title: null,
            group_by: [],
            split_by: [],
            columns: ["'hello'", "expr"],
            filter: [],
            sort: [],
            expressions: ["// expr\n1+1", "'hello'"],
            aggregates: {},
        },
        {
            version: API_VERSION,
            plugin: "X/Y Scatter",
            plugin_config: {
                columns: {
                    Region: {
                        symbols: {
                            Central: "circle",
                        },
                    },
                },
            },
            title: null,
            group_by: [],
            split_by: [],
            columns: ["'hello'", "expr"],
            filter: [],
            sort: [],
            expressions: {
                expr: "1+1",
                "'hello'": "'hello'",
            },
            aggregates: {},
        },
    ],
];

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore-all.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
    await page.evaluate(async () => {
        await document.querySelector("perspective-viewer").restore({
            plugin: "Datagrid",
        });
    });
});

test.describe("Migrate Viewer", () => {
    test.describe("Viewer config migrations", () => {
        for (const [name, old, current] of TESTS) {
            test(`Migrate '${name}'`, async ({ page }) => {
                const converted = convert(
                    JSON.parse(JSON.stringify(old), { warn: true }),
                    {
                        replace_defaults: true,
                    }
                );
                expect(converted).toEqual(current);
            });
        }
    });

    test.describe("migrate", async () => {
        for (const [name, old, current] of TESTS) {
            // NOTE: these tests were previously skipped.
            test(`restore '${name}'`, async ({ page }) => {
                const converted = convert(JSON.parse(JSON.stringify(old)), {
                    replace_defaults: true,
                });
                const config = await page.evaluate(async (old) => {
                    const viewer = document.querySelector("perspective-viewer");
                    await viewer.getTable();
                    old.settings = true;
                    await viewer.restore(old);
                    const current = await viewer.save();
                    current.settings = false;
                    return current;
                }, converted);

                expect(config.theme).toEqual("Pro Light");
                delete config["theme"];

                expect(config.settings).toEqual(false);
                delete config.settings;

                expect(config).toEqual(current);
                expect(convert(old, { replace_defaults: true })).toEqual(
                    current
                );

                const contents = await get_contents(page);
                await compareContentsToSnapshot(contents, [
                    `migrate-restore-${name}.txt`,
                ]);
            });
        }
    });
});
