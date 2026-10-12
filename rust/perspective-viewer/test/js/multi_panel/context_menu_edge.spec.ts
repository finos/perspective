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
import { armInvariants } from "./harness.ts";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

armInvariants(test);

async function openMenuNearRightEdge(page) {
    const box = (await page
        .locator("perspective-viewer #main_panel_container")
        .boundingBox())!;

    const x = box.x + box.width - 8;
    const y = box.y + box.height / 2;
    await page.mouse.click(x, y, { button: "right" });
    const menu = page.locator("perspective-context-menu");
    await menu.waitFor();
    return { menu, x, y };
}

async function twoFrames(page) {
    await page.evaluate(
        () =>
            new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
    );
}

test.describe("Context menu at the viewport edge", () => {
    test("the menu stays left of a right-edge cursor after its tables load", async ({
        page,
    }) => {
        const { menu, x } = await openMenuNearRightEdge(page);
        const viewport_width = page.viewportSize()!.width;
        await menu
            .locator(".context-menu-submenu .dropdown-menu-item")
            .first()
            .waitFor({ state: "attached" });

        await twoFrames(page);
        const box = (await menu.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(viewport_width);
        expect(box.x + box.width).toBeLessThanOrEqual(x + 1);
        await twoFrames(page);
        const again = (await menu.boundingBox())!;
        expect(again.x).toEqual(box.x);
    });

    test("the New flyout opens on the side with room near the right edge", async ({
        page,
    }) => {
        const { menu } = await openMenuNearRightEdge(page);
        const viewport_width = page.viewportSize()!.width;
        const new_item = menu.locator(".context-menu-item.has-submenu", {
            hasText: "New",
        });

        await new_item.hover();
        const flyout = menu.locator(".context-menu-submenu");
        await expect(flyout).toBeVisible();
        const menu_box = (await menu.boundingBox())!;
        const box = (await flyout.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(viewport_width);
        expect(box.x + box.width).toBeLessThanOrEqual(menu_box.x + 1);
    });
});
