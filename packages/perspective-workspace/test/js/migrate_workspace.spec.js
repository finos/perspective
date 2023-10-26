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

const { convert } = require("@finos/perspective-viewer/dist/cjs/migrate.js");
import { test, expect } from "@playwright/test";
import {
    compareLightDOMContents,
    compareShadowDOMContents,
} from "@finos/perspective-test";

async function setupTestWorkspace(page) {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
}

const TESTS = [
    [
        "Bucket by year",
        {
            viewers: {
                One: {
                    table: "superstore",
                    name: "One",
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
            },
            mode: "globalFilters",
            sizes: [1],
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        },
        {
            viewers: {
                One: {
                    version: "1.0.0",
                    table: "superstore",
                    title: "One",
                    plugin: "Y Area",
                    plugin_config: {},
                    group_by: ["bucket(\"Order Date\", 'M')"],
                    split_by: ["Ship Mode"],
                    columns: ["Sales"],
                    filter: [["Category", "==", "Office Supplies"]],
                    sort: [],
                    expressions: [
                        {
                            name: "bucket(\"Order Date\", 'M')",
                            expr: "bucket(\"Order Date\", 'M')",
                        },
                    ],
                    aggregates: {},
                    master: false,
                    linked: false,
                },
            },
            mode: "globalFilters",
            sizes: [1],
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        },
    ],
];

function runTests(context, compare) {
    for (const [name, old, current] of TESTS) {
        test(`Restore workspace - ${name}`, async ({ page }) => {
            await setupTestWorkspace(page);
            const converted = convert(JSON.parse(JSON.stringify(old)));
            const config = await page.evaluate(async (config) => {
                if (!window.__TABLE__) {
                    return;
                }

                const workspace = document.getElementById("workspace");
                await workspace.restore(config);
                return await workspace.save();
            }, converted);

            expect(config.viewers.One.theme).toEqual("Pro Light");
            delete config.viewers.One["theme"];

            expect(config.viewers.One.settings).toEqual(false);
            delete config.viewers.One["settings"];

            expect(config).toEqual(current);
            expect(convert(old, { replace_defaults: true })).toEqual(current);
            await compare(
                page,
                `${context}-${name.toLowerCase().replace(" ", "-")}.txt`
            );
        });
    }
}

test.describe("Migrate Workspace", () => {
    test.describe("Light DOM", () => {
        runTests("migrate-workspace-light-dom", compareLightDOMContents);
    });

    test.describe("Shadow DOM", () => {
        runTests("migrate-workspace-shadow-dom", compareShadowDOMContents);
    });
});
