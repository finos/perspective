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
    restoreWorkspaceError,
    saveWorkspace,
    ready,
} from "./helpers.ts";

test.beforeEach(ready);

const DEPTH_2 = {
    panels: { one: { table: "Big Regions", plugin: "Debug" } },
    derived_tables: {
        "Big Regions": {
            table: "Region Totals",
            filter: [["Sales", ">", 100]],
        },
        "Region Totals": { table: TABLE, group_by: ["Region"] },
    },
};

test.describe("derived_tables graph build", () => {
    test("builds parents first regardless of map order", async ({ page }) => {
        await restoreWorkspace(page, DEPTH_2);
        const hosted = await hostedTables(page);
        expect(hosted).toContain("Region Totals");
        expect(hosted).toContain("Big Regions");
    });

    test("an unchanged definition is reused rather than rebuilt", async ({
        page,
    }) => {
        await restoreWorkspace(page, DEPTH_2);
        const before = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            const view = await viewer.getView();
            const rows = await view.num_rows();
            view.delete();
            return rows;
        });

        await restoreWorkspace(page, DEPTH_2);
        const after = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            const view = await viewer.getView();
            const rows = await view.num_rows();
            view.delete();
            return rows;
        });

        expect(after).toBe(before);
        expect(await hostedTables(page)).toContain("Big Regions");
    });

    test("a rebuilt parent forces its descendants to rebuild", async ({
        page,
    }) => {
        await restoreWorkspace(page, DEPTH_2);
        await restoreWorkspace(page, {
            panels: { one: { table: "Big Regions", plugin: "Debug" } },
            derived_tables: {
                "Big Regions": {
                    table: "Region Totals",
                    filter: [["Sales", ">", 100]],
                },
                "Region Totals": { table: TABLE, group_by: ["State"] },
            },
        });

        const saved = await saveWorkspace(page);
        expect(saved.derived_tables["Region Totals"].group_by).toEqual([
            "State",
        ]);

        const columns = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            const table = await viewer.getTable();
            return Object.keys(await table.schema());
        });

        expect(columns.join(" ")).toContain("State");
    });

    test("a cycle is rejected and named", async ({ page }) => {
        const error = await restoreWorkspaceError(page, {
            panels: { one: { table: TABLE, plugin: "Debug" } },
            derived_tables: {
                A: { table: "B", group_by: ["Region"] },
                B: { table: "A", group_by: ["State"] },
            },
        });

        expect(error).toMatch(/cycle/);
        expect(error).toMatch(/A/);
        expect(error).toMatch(/B/);
        const hosted = await hostedTables(page);
        expect(hosted).not.toContain("A");
        expect(hosted).not.toContain("B");
    });
});
