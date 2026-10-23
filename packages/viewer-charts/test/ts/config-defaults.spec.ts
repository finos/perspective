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

import type { ViewerConfigUpdate } from "@perspective-dev/viewer";
import { expect, test } from "@perspective-dev/test";
import type { Page } from "@playwright/test";
import {
    gotoBasic,
    restoreChart,
    sweepPinnedTooltips,
    tooltipValue,
} from "./helpers";

const DATETIME_X: ViewerConfigUpdate = {
    plugin: "X/Y Scatter",
    columns: ["Order Date", "Sales"],
    group_by: [],
    split_by: [],
    sort: [["Order Date", "asc"]],
} as ViewerConfigUpdate;

async function datesBySales(page: Page): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    for (const cells of await sweepPinnedTooltips(page)) {
        const sales = tooltipValue(cells, "Sales");
        const date = tooltipValue(cells, "Order Date");
        if (sales !== undefined && date !== undefined) {
            out.set(sales, date);
        }
    }

    return out;
}

test.describe("Charts under config defaults", () => {
    test.beforeEach(async ({ page }) => {
        await gotoBasic(page);
    });

    test("tooltips follow a timezone default", async ({ page }) => {
        test.setTimeout(120_000);
        await restoreChart(page, DATETIME_X);
        const before = await datesBySales(page);
        await page.evaluate(async () => {
            const Viewer = customElements.get("perspective-viewer") as any;
            Viewer.setColumnConfigDefaults(
                { date_format: { timeZone: "Pacific/Honolulu" } },
                { type: "datetime" },
            );

            await document.querySelector("perspective-viewer")!.flush();
        });

        const after = await datesBySales(page);
        const shared = [...after.keys()].filter((sales) => before.has(sales));
        expect(shared.length).toBeGreaterThan(0);
        for (const sales of shared) {
            expect(after.get(sales)).not.toBe(before.get(sales));
        }

        const config = await page.evaluate(
            async () =>
                (await document
                    .querySelector("perspective-viewer")!
                    .save()) as any,
        );

        expect(config.columns_config).toEqual({});
    });
});
