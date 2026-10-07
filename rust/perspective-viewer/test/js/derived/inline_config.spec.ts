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

import type { Page } from "@playwright/test";

import { test, expect } from "../helpers.ts";
import {
    TABLE,
    hostedTables,
    ready,
    restoreWorkspace,
    restoreWorkspaceError,
    saveWorkspace,
} from "./helpers.ts";

test.beforeEach(ready);

const CHAIN = {
    panels: { one: { table: "Big Regions", plugin: "Debug" } },
    derived_tables: {
        "Region Totals": { table: TABLE, group_by: ["Region"] },
        "Big Regions": {
            table: "Region Totals",
            filter: [["Sales", ">", 100]],
        },
    },
};

async function save(page: Page): Promise<any> {
    return await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer")! as any;
        return await viewer.save();
    });
}

async function restore(page: Page, config: Record<string, unknown>) {
    await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer")! as any;
        await viewer.restore(config);
        await viewer.flush();
    }, config);
}

test.describe("inline derived table configs", () => {
    test("save() inlines a derived chain recursively", async ({ page }) => {
        await restoreWorkspace(page, CHAIN);
        const saved = await save(page);
        expect(saved.table.filter).toEqual([["Sales", ">", 100]]);
        expect(saved.table.table.group_by).toEqual(["Region"]);
        expect(saved.table.table.table).toBe(TABLE);
    });

    test("a non-derived panel's table stays a string", async ({ page }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: TABLE, plugin: "Debug" } },
        });

        const saved = await save(page);
        expect(saved.table).toBe(TABLE);
    });

    test("saveWorkspace() keeps panel tables as strings", async ({ page }) => {
        await restoreWorkspace(page, CHAIN);
        const saved = await saveWorkspace(page);
        expect(saved.panels.one.table).toBe("Big Regions");
        expect(saved.derived_tables["Big Regions"].table).toBe("Region Totals");
    });

    test("an identical inline chain rebinds to the existing tables", async ({
        page,
    }) => {
        await restoreWorkspace(page, CHAIN);
        const before = await hostedTables(page);
        await restore(page, {
            table: {
                table: { table: TABLE, group_by: ["Region"] },
                filter: [["Sales", ">", 100]],
            },
        });

        expect(await hostedTables(page)).toEqual(before);
        const saved = await saveWorkspace(page);
        expect(saved.panels.one.table).toBe("Big Regions");
    });

    test("a modified inline chain creates a new derived table", async ({
        page,
    }) => {
        await restoreWorkspace(page, CHAIN);
        const before = await hostedTables(page);
        await restore(page, {
            table: {
                table: { table: TABLE, group_by: ["Region"] },
                filter: [["Sales", ">", 500]],
            },
        });

        const after = await hostedTables(page);
        expect(after.length).toBe(before.length + 1);
        const saved = await saveWorkspace(page);
        expect(saved.panels.one.table).not.toBe("Big Regions");
        expect(Object.keys(saved.derived_tables).length).toBe(3);
    });

    test("restore(save()) is stable", async ({ page }) => {
        await restoreWorkspace(page, CHAIN);
        const first = await save(page);
        const before = await hostedTables(page);
        await restore(page, first);
        const second = await save(page);
        expect(second.table).toEqual(first.table);
        expect(await hostedTables(page)).toEqual(before);
    });

    test("restoreWorkspace rejects an inline panel table", async ({ page }) => {
        const error = await restoreWorkspaceError(page, {
            panels: {
                one: {
                    table: { table: TABLE, group_by: ["Region"] },
                    plugin: "Debug",
                },
            },
        });

        expect(error).not.toBe("");
        expect(error).toContain("string");
    });

    test("the DebugPanel shows and round-trips the inline form", async ({
        page,
    }) => {
        await restoreWorkspace(page, CHAIN);
        await restore(page, { settings: true });
        await page.locator("perspective-viewer #debug_tabbar_tab").click();
        const textarea = page.locator(
            "perspective-viewer #debug-panel-editor textarea",
        );

        await textarea.waitFor();
        const config = JSON.parse(await textarea.inputValue());
        expect(config.table.table.table).toBe(TABLE);
        const before = await hostedTables(page);
        await textarea.fill(JSON.stringify(config, null, 2));
        await page.locator("perspective-viewer #debug-panel-apply").click();
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")! as any;
            await viewer.flush();
        });

        expect(await hostedTables(page)).toEqual(before);
        const saved = await saveWorkspace(page);
        expect(saved.panels.one.table).toBe("Big Regions");
    });
});
