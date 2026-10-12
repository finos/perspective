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

test.describe("derived_tables save/restore", () => {
    test("saveWorkspace records derived_tables and no per-panel key", async ({
        page,
    }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Region Totals", plugin: "Debug" } },
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        const saved = await saveWorkspace(page);
        expect(Object.keys(saved.derived_tables)).toEqual(["Region Totals"]);
        expect(saved.derived_tables["Region Totals"].table).toBe(TABLE);
        expect(saved.derived_tables["Region Totals"].group_by).toEqual([
            "Region",
        ]);
        expect(saved.panels.one).not.toHaveProperty("derived");
        expect(saved.panels.one.table).toBe("Region Totals");
    });

    test("a depth-2 graph round-trips", async ({ page }) => {
        const config = {
            panels: { one: { table: "Big Regions", plugin: "Debug" } },
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
                "Big Regions": {
                    table: "Region Totals",
                    filter: [["Sales", ">", 100]],
                },
            },
        };

        await restoreWorkspace(page, config);
        const first = await saveWorkspace(page);
        await restoreWorkspace(page, first);
        const second = await saveWorkspace(page);
        expect(second.derived_tables).toEqual(first.derived_tables);
        expect(await hostedTables(page)).toContain("Big Regions");
    });

    test("an empty map deletes every derived table", async ({ page }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Region Totals", plugin: "Debug" } },
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        await restoreWorkspace(page, {
            panels: { one: { table: TABLE, plugin: "Debug" } },
            derived_tables: {},
        });

        const saved = await saveWorkspace(page);
        expect(saved).not.toHaveProperty("derived_tables");
        expect(await hostedTables(page)).not.toContain("Region Totals");
    });

    test("an absent key keeps the existing derived tables", async ({
        page,
    }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Region Totals", plugin: "Debug" } },
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
            },
        });

        await restoreWorkspace(page, { global_filters: [] });
        const saved = await saveWorkspace(page);
        expect(Object.keys(saved.derived_tables)).toEqual(["Region Totals"]);
    });
});
