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

import { test, expect } from "../helpers.ts";
import type { Page } from "@playwright/test";
import {
    TABLE,
    addTable,
    hostedTables,
    restoreWorkspace,
    ready,
} from "./helpers.ts";

test.beforeEach(ready);

const CONFIG = {
    panels: { one: { table: TABLE, plugin: "Debug" } },
    active: "one",
    derived_tables: {
        "Region Totals": { table: TABLE, group_by: ["Region"] },
    },
};

async function openNewMenu(page: Page) {
    await page.locator("perspective-viewer").locator("#new_panel").click();
    return page.locator("perspective-new-panel-menu, .new-panel-menu").first();
}

test.describe("the New menu marks derived tables", () => {
    test("a derived row is marked and a base row is not", async ({ page }) => {
        await restoreWorkspace(page, CONFIG);
        const menu = await openNewMenu(page);
        await expect(
            menu.locator(".dropdown-menu-item", { hasText: "Region Totals" }),
        ).toHaveClass(/is-derived/);

        await expect(
            menu.locator(".dropdown-menu-item", { hasText: TABLE }),
        ).not.toHaveClass(/is-derived/);
    });

    test("delete is offered at zero consumers", async ({ page }) => {
        await restoreWorkspace(page, CONFIG);
        const menu = await openNewMenu(page);
        await menu
            .locator(".dropdown-menu-item", { hasText: "Region Totals" })
            .locator(".derived_delete")
            .click();

        await expect
            .poll(async () => await hostedTables(page))
            .not.toContain("Region Totals");
    });

    test("delete is withheld while a panel reads it", async ({ page }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Region Totals", plugin: "Debug" } },
            active: "one",
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        const menu = await openNewMenu(page);
        const row = menu.locator(".dropdown-menu-item", {
            hasText: "Region Totals",
        });

        await expect(row.locator(".derived_delete")).toHaveCount(0);
        await expect(row.locator(".derived_consumers")).toHaveText("1");
    });
});

test.describe("the New menu tracks the hosted set while open", () => {
    test("a deleted row leaves the open menu", async ({ page }) => {
        await restoreWorkspace(page, CONFIG);
        const menu = await openNewMenu(page);
        const row = menu.locator(".dropdown-menu-item", {
            hasText: "Region Totals",
        });

        await row.locator(".derived_delete").click();
        await expect(row).toHaveCount(0);
        await expect(
            menu.locator(".dropdown-menu-item", { hasText: TABLE }),
        ).toHaveCount(1);

        expect(await hostedTables(page)).not.toContain("Region Totals");
    });

    test("a table created while open appears", async ({ page }) => {
        await restoreWorkspace(page, CONFIG);
        const menu = await openNewMenu(page);
        await expect(
            menu.locator(".dropdown-menu-item", { hasText: TABLE }),
        ).toHaveCount(1);

        await addTable(page, "latecomer");
        await expect(
            menu.locator(".dropdown-menu-item", { hasText: "latecomer" }),
        ).toHaveCount(1);
    });
});
