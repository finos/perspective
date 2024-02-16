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

import {
    test,
    expect,
    DEFAULT_CONFIG,
    compareSVGContentsToSnapshot,
} from "@finos/perspective-test";
import {
    compareContentsToSnapshot,
    API_VERSION,
} from "@finos/perspective-test";
import { PerspectiveViewerConfig } from "../../dist/esm/viewer";
import { convert } from "../../dist/esm/migrate";

async function get_contents(page) {
    return await page.evaluate(async () => {
        const plugin =
            document.querySelector("perspective-viewer")?.children[0];
        if (plugin?.tagName === "PERSPECTIVE-VIEWER-DATAGRID") {
            return plugin?.shadowRoot?.innerHTML || "MISSING";
        } else {
            return (
                plugin?.shadowRoot?.querySelector("#container")?.innerHTML ||
                "MISSING"
            );
        }
    });
}

const MIGRATE_BASE_CONFIG = (() => {
    const config = DEFAULT_CONFIG;
    delete config.theme;
    delete config.settings;
    return config;
})();

const TESTS: [string, any, PerspectiveViewerConfig][] = [
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
            column_config: {},
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
            column_config: {
                Sales: {
                    datagrid_number_style: {
                        number_bg_mode: "gradient",
                        bg_gradient: 10,
                    },
                },
            },
            plugin_config: {
                columns: {},
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
            column_config: {
                Sales: {
                    datagrid_number_style: {
                        bg_gradient: 10,
                        number_bg_mode: "gradient",
                    },
                },
            },
            plugin_config: {
                columns: {},
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
            ...MIGRATE_BASE_CONFIG,
            plugin: "Datagrid",
            column_config: {
                Sales: {
                    datagrid_number_style: {
                        fg_gradient: 10,
                        number_fg_mode: "bar",
                        neg_fg_color: "#115599",
                        pos_fg_color: "#115599",
                    },
                },
            },
            plugin_config: {
                columns: {},
                editable: false,
                scroll_lock: true,
            },
            columns: ["Sales"],
        },
    ],
    [
        "New API, reflexive (new API is unmodified)",
        {
            ...MIGRATE_BASE_CONFIG,
            plugin: "Datagrid",
            column_config: {
                Discount: {
                    datagrid_number_style: {
                        neg_bg_color: "#780aff",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#f5ac0f",
                    },
                },
                Profit: {
                    datagrid_number_style: {
                        neg_bg_color: "#f50fed",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#32cd82",
                    },
                },
                Sales: {
                    datagrid_number_style: {
                        neg_bg_color: "#f5ac0f",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#780aff",
                    },
                },
            },
            plugin_config: {
                columns: {},
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
        },
        {
            ...MIGRATE_BASE_CONFIG,
            plugin: "Datagrid",
            column_config: {
                Discount: {
                    datagrid_number_style: {
                        neg_bg_color: "#780aff",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#f5ac0f",
                    },
                },
                Profit: {
                    datagrid_number_style: {
                        neg_bg_color: "#f50fed",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#32cd82",
                    },
                },
                Sales: {
                    datagrid_number_style: {
                        neg_bg_color: "#f5ac0f",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#780aff",
                    },
                },
            },
            plugin_config: {
                columns: {},
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
            columns: ["'hello'", "expr", null, null, "Region"],
            filter: [],
            sort: [],
            expressions: ["// expr\n1+1", "'hello'"],
            aggregates: {},
        },
        {
            ...MIGRATE_BASE_CONFIG,
            version: API_VERSION,
            plugin: "X/Y Scatter",
            column_config: {
                Region: {
                    symbols: {
                        Central: "circle",
                    },
                },
            },
            columns: ["'hello'", "expr", null, null, "Region"],
            expressions: {
                expr: "1+1",
                "'hello'": "'hello'",
            },
        },
    ],
    [
        "From 2.7.1 - Datagrid",
        {
            version: "2.7.1",
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    datetime: {
                        format: "custom",
                        fractionalSecondDigits: 3,
                        second: "2-digit",
                        minute: "disabled",
                        hour: "2-digit",
                        day: "2-digit",
                        weekday: "short",
                        month: "narrow",
                        year: "numeric",
                        hour12: false,
                        timeZone: "America/Curacao",
                        datetime_color_mode: "foreground",
                    },
                    "Order ID": {
                        format: "link",
                        string_color_mode: "foreground",
                        color: "#ff0000",
                    },
                    "Row ID": {
                        number_bg_mode: "gradient",
                        fixed: 1,
                        pos_fg_color: "#000000",
                        neg_fg_color: "#000000",
                        bg_gradient: 9,
                    },
                    "Order Date": {
                        dateStyle: "disabled",
                        datetime_color_mode: "foreground",
                        color: "#00ff00",
                    },
                },
                editable: true,
                scroll_lock: false,
            },
            columns: ["Row ID", "Order ID", "Order Date", "datetime"],
            expressions: { datetime: "datetime(100)" },
            aggregates: {},
            filter: [],
            group_by: [],
            sort: [],
            split_by: [],
            title: null,
        },
        {
            ...MIGRATE_BASE_CONFIG,
            plugin: "Datagrid",
            plugin_config: {
                columns: {},
                editable: true,
                scroll_lock: false,
            },
            column_config: {
                datetime: {
                    datagrid_datetime_style: {
                        format: "custom",
                        fractionalSecondDigits: 3,
                        second: "2-digit",
                        minute: "disabled",
                        hour: "2-digit",
                        day: "2-digit",
                        weekday: "short",
                        month: "narrow",
                        year: "numeric",
                        hour12: false,
                        timeZone: "America/Curacao",
                        datetime_color_mode: "foreground",
                    },
                },
                "Order ID": {
                    datagrid_string_style: {
                        format: "link",
                        string_color_mode: "foreground",
                        color: "#ff0000",
                    },
                },
                "Row ID": {
                    datagrid_number_style: {
                        number_bg_mode: "gradient",
                        pos_fg_color: "#000000",
                        neg_fg_color: "#000000",
                        bg_gradient: 9,
                    },
                    number_string_format: {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                    },
                },
                "Order Date": {
                    datagrid_datetime_style: {
                        dateStyle: "disabled",
                        datetime_color_mode: "foreground",
                        color: "#00ff00",
                    },
                },
            },
            columns: ["Row ID", "Order ID", "Order Date", "datetime"],
            expressions: {
                datetime: "datetime(100)",
            },
        },
    ],
    [
        "From 2.7.1 - X/Y Scatter",
        {
            version: "2.7.1",
            plugin: "X/Y Scatter",
            plugin_config: {
                columns: {
                    Category: {
                        symbols: {
                            Furniture: "star",
                        },
                    },
                },
            },
            columns: ["Row ID", "City", null, null, "Category"],
            aggregates: {},
            expressions: {},
            filter: [],
            group_by: [],
            sort: [],
            split_by: [],
            title: null,
        },
        {
            ...MIGRATE_BASE_CONFIG,
            plugin: "X/Y Scatter",
            column_config: {
                Category: {
                    symbols: {
                        Furniture: "star",
                    },
                },
            },
            columns: ["Row ID", "City", null, null, "Category"],
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
        await document?.querySelector("perspective-viewer")?.restore({
            plugin: "Datagrid",
        });
    });
});

test.describe("Migrate Viewer", () => {
    test.describe("Viewer config migrations", () => {
        for (const [name, old, current] of TESTS) {
            test(`Migrate '${name}'`, async ({ page }) => {
                const converted = convert(JSON.parse(JSON.stringify(old)), {
                    replace_defaults: true,
                    verbose: true,
                });
                expect(converted).toEqual(current);
            });
        }
    });

    test.describe("migrate", async () => {
        for (const [name, given, expected] of TESTS) {
            test(`restore '${name}'`, async ({ page }) => {
                const saved = await page.evaluate(async (converted) => {
                    const viewer =
                        document.querySelector("perspective-viewer")!;
                    await viewer.getTable();
                    converted.settings = true;
                    await viewer.restore(converted);
                    const saved = await viewer.save();
                    saved.settings = false;
                    return saved;
                }, expected);

                expect(saved.theme).toEqual("Pro Light");
                delete saved["theme"];

                expect(saved.settings).toEqual(false);
                delete saved.settings;

                expect(saved).toEqual(expected);

                let selector;
                if (saved.plugin === "Datagrid") {
                    selector = "perspective-viewer-datagrid";
                } else if (saved.plugin === "Map Scatter") {
                    selector = "perspective-viewer-openlayers-scatter";
                } else {
                    const plugin = saved.plugin
                        ?.replace(/[-\/\s]/gi, "")
                        .toLowerCase();
                    selector = `perspective-viewer-d3fc-${plugin}`;
                }
                await compareSVGContentsToSnapshot(page, selector, [
                    `migrate-restore-${name}.txt`,
                ]);
            });
        }
    });
});
