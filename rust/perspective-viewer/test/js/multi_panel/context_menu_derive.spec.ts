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

// The panel context menu's "Derive Table" command: pivot gating and the
// promote-and-rebind flow.

import { test, expect } from "../helpers.ts";
import { TABLE, hostedTables, restoreWorkspace } from "../derived/helpers.ts";
import { armInvariants } from "./harness.ts";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

armInvariants(test);

async function deriveItem(page) {
    await page
        .locator("perspective-viewer perspective-viewer-plugin")
        .first()
        .click({ button: "right" });

    const menu = page.locator("perspective-context-menu");
    await menu.waitFor();
    return menu.locator(".context-menu-item", { hasText: "Derive Table" });
}

test.describe("Context menu New flyout tracks deletes", () => {
    test("a derived row deleted from the flyout disappears in place", async ({
        page,
    }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: TABLE, plugin: "Debug" } },
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        await page
            .locator("perspective-viewer perspective-viewer-plugin")
            .first()
            .click({ button: "right" });

        const menu = page.locator("perspective-context-menu");
        await menu.waitFor();
        const new_item = menu.locator(".context-menu-item.has-submenu", {
            hasText: "New",
        });

        await new_item.hover();
        const row = new_item.locator(
            ".context-menu-submenu .dropdown-menu-item",
            { hasText: "Region Totals" },
        );

        await row.waitFor();
        await row.locator(".derived_delete").click();
        await expect(row).toHaveCount(0);
        await expect(
            new_item.locator(".context-menu-submenu .dropdown-menu-item", {
                hasText: TABLE,
            }),
        ).toHaveCount(1);
    });
});

test.describe("Context menu Derive Table", () => {
    test("disabled without pivots", async ({ page }) => {
        const item = await deriveItem(page);
        await expect(item).toHaveClass(/disabled/);
    });

    test("enabled with split_by only", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer") as any;
            await viewer.restore({ split_by: ["Region"] });
            await viewer.flush();
        });

        const item = await deriveItem(page);
        await expect(item).not.toHaveClass(/disabled/);
    });

    test("derives and rebinds a pivoted panel", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer") as any;
            await viewer.restore({ group_by: ["Region"] });
            await viewer.flush();
        });

        const before = await hostedTables(page);
        const item = await deriveItem(page);
        await expect(item).not.toHaveClass(/disabled/);
        await item.click();
        await expect
            .poll(async () => (await hostedTables(page)).length)
            .toBe(before.length + 1);

        const saved = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer") as any;
            await viewer.flush();
            return await viewer.saveWorkspace();
        });

        const panel: any = Object.values(saved.panels)[0];
        expect(panel.table).not.toBe(TABLE);
        expect(Object.keys(saved.derived_tables)).toEqual([panel.table]);
        expect(saved.derived_tables[panel.table].table).toBe(TABLE);
        expect(saved.derived_tables[panel.table].group_by).toEqual(["Region"]);
    });
});
