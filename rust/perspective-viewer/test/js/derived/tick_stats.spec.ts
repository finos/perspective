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
import { TABLE, hostedTables, restoreWorkspace, ready } from "./helpers.ts";

test.beforeEach(ready);

test.describe("rows counter on a ticking parent", () => {
    test("tracks only the derived table while the parent updates", async ({
        page,
    }) => {
        await restoreWorkspace(page, {
            panels: {
                one: { table: TABLE, plugin: "Debug", group_by: ["Region"] },
            },
            active: "one",
        });

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
            .toBe(2);

        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer") as any;
            await viewer.flush();
        });

        const rows = page.locator("perspective-viewer-tab #rows");
        await expect(rows).toHaveText(/^5 \//);
        await page.evaluate(() => {
            const shadow = document.querySelector(
                "perspective-viewer-tab",
            )!.shadowRoot!;

            const read = () => shadow.querySelector("#rows")?.textContent ?? "";

            (window as any).__ROWS__ = [read()];
            new MutationObserver(() =>
                (window as any).__ROWS__.push(read()),
            ).observe(shadow, {
                subtree: true,
                childList: true,
                characterData: true,
            });
        });

        await page.evaluate(async (TABLE) => {
            const worker = (window as any).__TEST_WORKER__;
            const table = await worker.open_table(TABLE);
            for (let i = 0; i < 5; i++) {
                await table.update([{ Region: "East", Sales: 1 }]);
                await new Promise((x) => setTimeout(x, 60));
            }

            const viewer = document.querySelector("perspective-viewer") as any;
            await viewer.flush();
        }, TABLE);

        await page.waitForTimeout(250);
        const texts: string[] = await page.evaluate(
            () => (window as any).__ROWS__,
        );

        for (const text of texts) {
            expect(text).not.toContain("9,9");
        }

        await expect(rows).toHaveText(/^5 \//);
    });
});
