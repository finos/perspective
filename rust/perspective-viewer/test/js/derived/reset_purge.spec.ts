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
    saveWorkspace,
    ready,
} from "./helpers.ts";

test.beforeEach(ready);

const CHAIN = {
    panels: { one: { table: "Big Regions", plugin: "Debug" } },
    active: "one",
    derived_tables: {
        "Big Regions": {
            table: "Region Totals",
            filter: [["Sales", ">", 100]],
        },
        "Region Totals": { table: TABLE, group_by: ["Region"] },
    },
};

function resetButton(page: Page) {
    return page.locator("perspective-viewer #reset");
}

test.describe("shift-reset purges derived tables", () => {
    test("a shift-click deletes the chain and rebinds to the root", async ({
        page,
    }) => {
        await restoreWorkspace(page, CHAIN);
        await resetButton(page).click({ modifiers: ["Shift"] });
        const saved = await saveWorkspace(page);
        expect(saved).not.toHaveProperty("derived_tables");
        expect(saved.panels.one.table).toBe(TABLE);
        expect(await hostedTables(page)).toEqual([TABLE]);
        const single = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            return await viewer.save();
        });

        expect(single.table).toBe(TABLE);
    });

    test("a plain click keeps the chain", async ({ page }) => {
        await restoreWorkspace(page, CHAIN);
        await resetButton(page).click();
        const saved = await saveWorkspace(page);
        expect(Object.keys(saved.derived_tables).sort()).toEqual([
            "Big Regions",
            "Region Totals",
        ]);

        expect(saved.panels.one.table).toBe("Big Regions");
        expect(await hostedTables(page)).toContain("Big Regions");
    });

    test("every sharing panel is released to the root", async ({ page }) => {
        await restoreWorkspace(page, {
            layout: {
                type: "split-layout",
                orientation: "horizontal",
                sizes: [0.5, 0.5],
                children: [
                    { type: "tab-layout", tabs: ["one"], selected: 0 },
                    { type: "tab-layout", tabs: ["two"], selected: 0 },
                ],
            },
            panels: {
                one: { table: "Region Totals", plugin: "Debug" },
                two: { table: "Region Totals", plugin: "Debug" },
            },
            active: "one",
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        await resetButton(page).click({ modifiers: ["Shift"] });
        const saved = await saveWorkspace(page);
        expect(saved).not.toHaveProperty("derived_tables");
        expect(saved.panels.one.table).toBe(TABLE);
        expect(saved.panels.two.table).toBe(TABLE);
        expect(await hostedTables(page)).toEqual([TABLE]);
    });

    test("a pending chain is cleared and never resurrects", async ({
        page,
    }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Later Totals", plugin: "Debug" } },
            active: "one",
            derived_tables: {
                "Later Totals": { table: "Later", group_by: ["Region"] },
            },
        });

        await expect(resetButton(page)).toHaveCount(0);
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer") as any;
            await viewer.reset(true);
        });

        const saved = await saveWorkspace(page);
        expect(saved).not.toHaveProperty("derived_tables");
        expect(saved.panels.one.table).toBe("Later");
        await addTable(page, "Later");
        await expect
            .poll(async () => await hostedTables(page))
            .toContain("Later");

        expect(await hostedTables(page)).not.toContain("Later Totals");
        await expect
            .poll(async () => (await saveWorkspace(page)).panels.one.table)
            .toBe("Later");
    });

    test("reset(true) purges via the API", async ({ page }) => {
        await restoreWorkspace(page, CHAIN);
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            await viewer.reset(true);
        });

        expect(await hostedTables(page)).toEqual([TABLE]);
        expect(await saveWorkspace(page)).not.toHaveProperty("derived_tables");
    });

    test("reset() without the flag keeps the chain", async ({ page }) => {
        await restoreWorkspace(page, CHAIN);
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            await viewer.reset();
        });

        expect(await hostedTables(page)).toContain("Big Regions");
        expect(Object.keys((await saveWorkspace(page)).derived_tables)).toEqual(
            ["Big Regions", "Region Totals"],
        );
    });
});
