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

const ONE_PANEL = {
    panels: { one: { table: "Region Totals", plugin: "Debug" } },
    active: "one",
    derived_tables: {
        "Region Totals": { table: TABLE, group_by: ["Region"] },
    },
};

const TWO_PANELS = {
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
};

function release(page: Page) {
    return page
        .locator("perspective-viewer")
        .locator("#derived_stack .derived_level.is-own .derived_release");
}

async function boundTable(page: Page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer")!;
        // @ts-ignore
        return (await viewer.save()).table;
    });
}

test.describe("back to parent and delete", () => {
    test("click rebinds to the parent and keeps the table", async ({
        page,
    }) => {
        await restoreWorkspace(page, ONE_PANEL);
        await release(page).click();
        expect(await boundTable(page)).toBe(TABLE);
        expect(await hostedTables(page)).toContain("Region Totals");
    });

    test("click restores the config the table was created with", async ({
        page,
    }) => {
        await restoreWorkspace(page, ONE_PANEL);
        await release(page).click();
        const saved = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
            // @ts-ignore
            return await viewer.save();
        });

        expect(saved.group_by).toEqual(["Region"]);
    });

    test("shift+click rebinds and deletes", async ({ page }) => {
        await restoreWorkspace(page, ONE_PANEL);
        await release(page).click({ modifiers: ["Shift"] });
        expect(await boundTable(page)).toBe(TABLE);
        expect(await hostedTables(page)).not.toContain("Region Totals");
    });

    test("the shift affordance is offered to a sole consumer", async ({
        page,
    }) => {
        await restoreWorkspace(page, ONE_PANEL);
        await expect(release(page)).toHaveClass(/shift-alt-icon/);
    });

    test("the shift affordance is withheld at two consumers", async ({
        page,
    }) => {
        await restoreWorkspace(page, TWO_PANELS);
        await expect(release(page).first()).not.toHaveClass(/shift-alt-icon/);
    });

    test("shift+click keeps the table when another panel reads it", async ({
        page,
    }) => {
        await restoreWorkspace(page, TWO_PANELS);
        await release(page)
            .first()
            .click({ modifiers: ["Shift"] });
        expect(await hostedTables(page)).toContain("Region Totals");
    });
});
