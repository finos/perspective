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

import { test, expect } from "@perspective-dev/test";
import { PageView } from "@perspective-dev/test";
import { INACTIVE_DRAG, localDrag } from "./dragdrop_test_utils";

test.beforeEach(async ({ page }) => {
    await page.goto(
        "/rust/perspective-viewer/test/html/column-settings-enabled.html",
    );
    await page.evaluate(async () => {
        while (!(window as any)["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

const ROWS = "#sub-columns .scroll-panel-container .column-selector-column";

test.describe("Drag and Drop", () => {
    test("a drop into group_by keeps the untouched inactive rows' DOM nodes", async ({
        page,
    }) => {
        const view = new PageView(page);
        await view.restore({ settings: true, columns: ["Sales", "Profit"] });
        const before = await view.container.locator(ROWS).evaluateAll((els) =>
            els.map((el, i) => {
                (el as HTMLElement).dataset.identity = String(i);
                return el.querySelector(".column_name")!.textContent;
            }),
        );

        const configUpdated = await view.getEventListener(
            "perspective-config-update",
        );

        const source = view.container.locator(INACTIVE_DRAG).first();
        await localDrag(page, source, view.container.locator("#group_by"));
        await configUpdated();
        const after = await view.container.locator(ROWS).evaluateAll((els) =>
            els.map((el) => ({
                name: el.querySelector(".column_name")!.textContent,
                identity: (el as HTMLElement).dataset.identity ?? null,
            })),
        );

        expect(after.length).toBeGreaterThan(5);
        for (const row of after) {
            expect(row.identity).not.toBeNull();
            expect(before[Number(row.identity)]).toEqual(row.name);
        }
    });
});
