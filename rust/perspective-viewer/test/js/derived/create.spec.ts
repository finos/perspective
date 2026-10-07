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
import { TABLE, hostedTables, restoreWorkspace, ready } from "./helpers.ts";

test.beforeEach(ready);

function stack(page: Page) {
    return page.locator("perspective-viewer").locator("#derived_stack");
}

async function panel(page: Page, extra: Record<string, unknown> = {}) {
    await restoreWorkspace(page, {
        panels: { one: { table: TABLE, plugin: "Debug", ...extra } },
        active: "one",
    });
}

async function derive(page: Page) {
    const before = await hostedTables(page);
    await page
        .locator("perspective-viewer perspective-viewer-plugin")
        .first()
        .click({ button: "right" });

    const menu = page.locator("perspective-context-menu");
    await menu.waitFor();
    await menu
        .locator(".context-menu-item", { hasText: "Derive Table" })
        .click();

    await expect
        .poll(async () => (await hostedTables(page)).length)
        .toBe(before.length + 1);

    return (await hostedTables(page)).find((x) => !before.includes(x))!;
}

async function boundTable(page: Page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer")!;
        // @ts-ignore
        const table = await viewer.getTable();
        return await table.get_name();
    });
}

test.describe("derive a table from the context menu", () => {
    test("the group is absent with no pivots and no derivation", async ({
        page,
    }) => {
        await panel(page);
        await expect(stack(page)).toHaveCount(0);
    });

    test("the chain renders in the active columns panel", async ({ page }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Region Totals", plugin: "Debug" } },
            active: "one",
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        await expect(
            page.locator("perspective-viewer #active-columns #derived_stack"),
        ).toHaveCount(1);
    });

    test("creates under a generated name and rebinds the panel", async ({
        page,
    }) => {
        await panel(page, { group_by: ["Region"] });
        const created = await derive(page);
        await expect(
            stack(page).locator(".derived_level.is-own .derived_label"),
        ).toHaveText(created);

        expect(await hostedTables(page)).toContain(created);
        expect(await boundTable(page)).toBe(created);
    });

    test("a second creation derives a chained table under a distinct name", async ({
        page,
    }) => {
        await panel(page, { group_by: ["Region"] });
        const first = await derive(page);
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            await viewer.restore({ group_by: ["State"] });
            // @ts-ignore
            await viewer.flush();
        });

        const second = await derive(page);
        expect(second).not.toBe(first);
        await expect(stack(page).locator(".derived_level")).toHaveCount(2);
        expect(await boundTable(page)).toBe(second);
    });

    test("the created table carries the group_by key column", async ({
        page,
    }) => {
        await panel(page, { group_by: ["Region"] });
        await derive(page);
        const columns = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            const table = await viewer.getTable();
            return Object.keys(await table.schema());
        });

        expect(columns).toContain("Region");
    });

    test("a derived panel with no pivots still shows its chain", async ({
        page,
    }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Region Totals", plugin: "Debug" } },
            active: "one",
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        await expect(
            stack(page).locator(".derived_level.is-own .derived_label"),
        ).toHaveText("Region Totals");

        await expect(stack(page).locator(".derived_create")).toHaveCount(0);
    });
});
