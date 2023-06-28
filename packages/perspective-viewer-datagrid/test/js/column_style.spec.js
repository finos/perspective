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

import { test, expect } from "@playwright/test";
import { compareContentsToSnapshot } from "@finos/perspective-test";

async function get_contents(
    page,
    selector = "perspective-viewer perspective-viewer-datagrid regular-table",
    shadow = false
) {
    return await page.evaluate(
        async ({ selector, shadow }) => {
            const viewer = document.querySelector(selector);
            return (shadow ? viewer.shadowRoot : viewer).innerHTML || "MISSING";
        },
        { selector, shadow }
    );
}

async function test_column(page, selector, selector2) {
    const { x, y } = await page.evaluate(async (selector) => {
        const viewer = document.querySelector("perspective-viewer");
        await viewer.getTable();
        await viewer.toggleConfig();
        window.__events__ = [];
        viewer.addEventListener("perspective-config-update", (evt) => {
            window.__events__.push(evt);
        });

        const header_button = viewer.querySelector(
            "regular-table thead tr:last-child th" + selector
        );

        const rect = header_button.getBoundingClientRect();
        return {
            x: Math.floor(rect.left + rect.width / 2),
            y: Math.floor(rect.top + (3 * rect.height) / 4),
        };
    }, selector);

    await page.mouse.click(x, y);
    const style_menu = await page.waitForSelector(
        `perspective-${selector2}-column-style`
    );

    await new Promise((x) => setTimeout(x, 3000));

    return get_contents(page, ` perspective-${selector2}-column-style`, true);
}

test.describe("Column Style Tests", () => {
    test("perspective-config-update event is fired when column style is changed", async ({
        page,
    }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
            });
        });

        const { x, y } = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            // Await the table load
            await viewer.getTable();

            // Open the config panel
            await viewer.toggleConfig();

            // Register a listener for `perspective-config-update` event
            window.__events__ = [];
            viewer.addEventListener("perspective-config-update", (evt) => {
                window.__events__.push(evt);
            });

            // Find the column config menu button
            const header_button = viewer.querySelector(
                "regular-table thead tr:last-child th"
            );

            // Get the button coords (slightly lower than center
            // because of the location of the menu button within
            // this element)
            const rect = header_button.getBoundingClientRect();
            return {
                x: Math.floor(rect.left + rect.width / 2),
                y: Math.floor(rect.top + (3 * rect.height) / 4),
            };
        });

        // Click the menu button
        await page.mouse.click(x, y);

        // Await the style menu existing on the page
        const style_menu = await page.waitForSelector(
            "perspective-number-column-style"
        );

        const { x: xx, y: yy } = await page.evaluate(async (style_menu) => {
            // Find the 'bar' button
            const bar_button = style_menu.shadowRoot.querySelector(
                '#radio-list-1[name="foreground-list"]'
            );

            // Get its coords
            const rect = bar_button.getBoundingClientRect();
            return {
                x: Math.floor(rect.left + rect.width / 2),
                y: Math.floor(rect.top + rect.height / 2),
            };
        }, style_menu);

        // Click the button
        await page.mouse.click(xx, yy);

        const count = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            // Await the plugin rendering
            await viewer.flush();

            // Count the events;
            return window.__events__.length;
        });

        // Expect 1 event
        expect(count).toEqual(1);
    });

    test("Column style menu opens for numeric columns", async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
            });
        });

        const contents = await test_column(page, "", "number");

        await compareContentsToSnapshot(contents, ["number_column_style.txt"]);
    });

    test("Column style menu opens for string columns", async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer").restore({
                plugin: "Datagrid",
            });
        });

        const contents = await test_column(page, ":nth-child(2)", "string");

        await compareContentsToSnapshot(contents, ["string_column_style.txt"]);
    });
});
