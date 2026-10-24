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

import { test } from "@perspective-dev/test";
import type { Page } from "@playwright/test";
import { expectViewerScreenshot, gotoBasic, restoreChart } from "../helpers";

async function setColumnDefaults(
    page: Page,
    defaults: Record<string, unknown>,
    options: Record<string, unknown>,
) {
    await page.evaluate(
        ({ defaults, options }) => {
            const Viewer = customElements.get("perspective-viewer") as any;
            Viewer.setColumnConfigDefaults(defaults, options);
        },
        { defaults, options },
    );
}

test.describe("Config defaults", () => {
    test.beforeEach(async ({ page }) => {
        await gotoBasic(page);
    });

    test("a timezone default keeps adaptive axis labels", async ({ page }) => {
        await setColumnDefaults(
            page,
            { date_format: { timeZone: "Pacific/Honolulu" } },
            { type: "datetime" },
        );

        await restoreChart(page, {
            plugin: "X/Y Line",
            columns: ["Order Date", "Profit"],
        });

        await expectViewerScreenshot(page);
    });

    test("a timezone default applies to datetime category labels", async ({
        page,
    }) => {
        await setColumnDefaults(
            page,
            { date_format: { timeZone: "Pacific/Honolulu" } },
            { type: "datetime" },
        );

        await restoreChart(page, {
            plugin: "Y Bar",
            columns: ["Sales"],
            group_by: ["Order Date", "Region"],
            filter: [["Sales", ">", 1000]],
        } as never);

        await expectViewerScreenshot(page);
    });

    test("a display default fixes axis labels", async ({ page }) => {
        await setColumnDefaults(
            page,
            { date_format: { dateStyle: "long" } },
            { type: "datetime" },
        );

        await restoreChart(page, {
            plugin: "X/Y Line",
            columns: ["Order Date", "Profit"],
        });

        await expectViewerScreenshot(page);
    });
});
