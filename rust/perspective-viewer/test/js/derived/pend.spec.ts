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
    addTable,
    hostedTables,
    restoreWorkspace,
    saveWorkspace,
    ready,
} from "./helpers.ts";

test.beforeEach(ready);

test.describe("derived_tables pending on a missing parent", () => {
    test("a missing parent pends instead of erroring", async ({ page }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Later Totals", plugin: "Debug" } },
            derived_tables: {
                "Later Totals": { table: "Later", group_by: ["Region"] },
            },
        });

        expect(await hostedTables(page)).not.toContain("Later Totals");
        const saved = await saveWorkspace(page);
        expect(saved.derived_tables["Later Totals"].table).toBe("Later");
    });

    test("it builds when the parent arrives", async ({ page }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Later Totals", plugin: "Debug" } },
            derived_tables: {
                "Later Totals": { table: "Later", group_by: ["Region"] },
            },
        });

        await addTable(page, "Later");
        await expect
            .poll(async () => await hostedTables(page))
            .toContain("Later Totals");
    });

    test("a pending subgraph builds parents first", async ({ page }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Big Later", plugin: "Debug" } },
            derived_tables: {
                "Big Later": {
                    table: "Later Totals",
                    filter: [["Sales", ">", 0]],
                },
                "Later Totals": { table: "Later", group_by: ["Region"] },
            },
        });

        expect(await hostedTables(page)).not.toContain("Later Totals");
        await addTable(page, "Later");
        await expect
            .poll(async () => await hostedTables(page))
            .toContain("Big Later");
    });

    test("an unrelated table restores normally alongside a pending one", async ({
        page,
    }) => {
        await restoreWorkspace(page, {
            panels: { one: { table: "Region Totals", plugin: "Debug" } },
            derived_tables: {
                "Region Totals": { table: TABLE, group_by: ["Region"] },
                "Later Totals": { table: "Later", group_by: ["Region"] },
            },
        });

        const hosted = await hostedTables(page);
        expect(hosted).toContain("Region Totals");
        expect(hosted).not.toContain("Later Totals");
    });
});
