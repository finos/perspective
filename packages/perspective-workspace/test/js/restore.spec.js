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

import { test, expect } from "@playwright/test";
import {
    compareLightDOMContents,
    compareShadowDOMContents,
} from "@finos/perspective-test";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

function tests(context, compare) {
    test("restore workspace with detail only", async ({ page }) => {
        const config = {
            viewers: {
                One: { table: "superstore", name: "One" },
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-detail-only.txt`,
        );
    });

    test("restore workspace with master and detail", async ({ page }) => {
        const config = {
            viewers: {
                One: {
                    table: "superstore",
                    name: "Test",
                    group_by: ["State"],
                    columns: ["Sales", "Profit"],
                },
                Two: { table: "superstore", name: "One" },
            },
            master: {
                widgets: ["One"],
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["Two"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-master-and-detail.txt`,
        );
    });

    test.skip("save workspace with settings panel open", async ({ page }) => {
        const config = {
            viewers: {
                One: {
                    table: "superstore",
                    name: "One",
                    group_by: ["State"],
                    columns: ["Sales", "Profit"],
                },
                Two: { table: "superstore", name: "Two" },
            },
            detail: {
                main: {
                    type: "split-area",
                    orientation: "vertical",
                    children: [
                        {
                            type: "tab-area",
                            widgets: ["One"],
                            currentIndex: 0,
                        },
                        {
                            type: "tab-area",
                            widgets: ["Two"],
                            currentIndex: 0,
                        },
                    ],
                    sizes: [0.5, 0.5],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        const button = await page.locator(".p-TabBar-tabLabel");
        await button.first().click();
        const saved = await page.evaluate(async () => {
            const workspace = document.getElementById("workspace");
            return await workspace.save();
        });

        expect(saved).toEqual({
            sizes: [1],
            detail: {
                main: {
                    type: "split-area",
                    orientation: "vertical",
                    children: [
                        { type: "tab-area", widgets: ["One"], currentIndex: 0 },
                        { type: "tab-area", widgets: ["Two"], currentIndex: 0 },
                    ],
                    sizes: [0.5, 0.5],
                },
            },
            mode: "globalFilters",
            viewers: {
                One: {
                    plugin: "Datagrid",
                    plugin_config: {
                        columns: {},
                        editable: false,
                        scroll_lock: false,
                    },
                    settings: false,
                    theme: "Pro Light",
                    title: null,
                    group_by: ["State"],
                    split_by: [],
                    columns: ["Sales", "Profit"],
                    filter: [],
                    sort: [],
                    expressions: [],
                    aggregates: {},
                    master: false,
                    table: "superstore",
                    linked: false,
                },
                Two: {
                    plugin: "Datagrid",
                    plugin_config: {
                        columns: {},
                        editable: false,
                        scroll_lock: false,
                    },
                    settings: false,
                    theme: "Pro Light",
                    title: null,
                    group_by: [],
                    split_by: [],
                    columns: [
                        "Row ID",
                        "Order ID",
                        "Order Date",
                        "Ship Date",
                        "Ship Mode",
                        "Customer ID",
                        "Customer Name",
                        "Segment",
                        "Country",
                        "City",
                        "State",
                        "Postal Code",
                        "Region",
                        "Product ID",
                        "Category",
                        "Sub-Category",
                        "Product Name",
                        "Sales",
                        "Quantity",
                        "Discount",
                        "Profit",
                    ],
                    filter: [],
                    sort: [],
                    expressions: [],
                    aggregates: {},
                    master: false,
                    table: "superstore",
                    linked: false,
                },
            },
        });

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, saved);

        return compare(
            page,
            `${context}-save-workspace-with-settings-panel-open.txt`,
        );
    });
}

test.describe("Workspace restore", () => {
    test.describe("Light DOM", () => {
        tests("light-dom", compareLightDOMContents);
    });

    test.describe("Shadow DOM", () => {
        tests("shadow-dom", compareShadowDOMContents);
    });
});
