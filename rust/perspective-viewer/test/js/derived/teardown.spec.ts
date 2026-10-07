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
import {
    TABLE,
    hostedTables,
    restoreWorkspace,
    saveWorkspace,
    ready,
} from "./helpers.ts";

test.beforeEach(ready);

const SHARED = {
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
    derived_tables: {
        "Region Totals": { table: TABLE, group_by: ["Region"] },
    },
};

test.describe("derived tables outlive their panels", () => {
    test("two panels share one derived table", async ({ page }) => {
        await restoreWorkspace(page, SHARED);
        const saved = await saveWorkspace(page);
        expect(saved.panels.one.table).toBe("Region Totals");
        expect(saved.panels.two.table).toBe("Region Totals");
        expect(Object.keys(saved.derived_tables)).toEqual(["Region Totals"]);
    });

    test("closing one panel leaves the table and the other panel", async ({
        page,
    }) => {
        await restoreWorkspace(page, SHARED);
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            await viewer.removePanel("two");
            // @ts-ignore
            await viewer.flush();
        });

        expect(await hostedTables(page)).toContain("Region Totals");
        const saved = await saveWorkspace(page);
        expect(saved.panels.one.table).toBe("Region Totals");
    });

    test("rebinding a panel away leaves the table listed", async ({ page }) => {
        await restoreWorkspace(page, SHARED);
        await page.evaluate(async (table) => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            await viewer.restore({ table });
            // @ts-ignore
            await viewer.flush();
        }, TABLE);

        expect(await hostedTables(page)).toContain("Region Totals");
    });
});
