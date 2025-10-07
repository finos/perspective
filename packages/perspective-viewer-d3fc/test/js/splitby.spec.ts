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

import { expect, test } from "@finos/perspective-test";

test.describe("Tooltip data values with various 'Split By' configurations", () => {
    test("Show valid tooltip data with no 'Split By' configuration", async ({
        page,
    }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "X/Y Line",
                settings: true,
                columns: ["Row ID", "Postal Code", null],
                group_by: [],
                split_by: [],
            });
        });

        await page.hover(
            "#container > d3fc-group > d3fc-svg.svg-plot-area.plot-area > svg > g:nth-child(2) > g > g:nth-child(1) > g > path",
            {
                force: true,
            },
        );
        await page.waitForSelector("#tooltip-values > li:nth-child(1)");

        let tooltip_row_id_value = await page.evaluate(async () => {
            return document
                .querySelector("perspective-viewer-d3fc-xyline")
                ?.shadowRoot?.querySelector(
                    "#tooltip-values > li:nth-child(2) > b",
                )?.textContent;
        });

        expect(tooltip_row_id_value).toBeTruthy();
        expect(tooltip_row_id_value).toMatch(/^(?!NaN$|-$).+$/);
    });
    test("Show valid tooltip data with one 'Split By' configuration", async ({
        page,
    }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "X/Y Line",
                settings: true,
                columns: ["Row ID", "Postal Code", null],
                group_by: [],
                split_by: ["Sub-Category"],
            });
        });

        await page.hover(
            "#container > d3fc-group > d3fc-svg.svg-plot-area.plot-area > svg > g:nth-child(2) > g > g:nth-child(1) > g > path",
            {
                force: true,
            },
        );
        await page.waitForSelector("#tooltip-values > li:nth-child(2)");

        let tooltip_row_id_value = await page.evaluate(async () => {
            return document
                .querySelector("perspective-viewer-d3fc-xyline")
                ?.shadowRoot?.querySelector(
                    "#tooltip-values > li:nth-child(2) > b",
                )?.textContent;
        });

        expect(tooltip_row_id_value).toBeTruthy();
        expect(tooltip_row_id_value).toMatch(/^(?!NaN$|-$).+$/);
    });
    test("Show valid tooltip data with multiple 'Split By' configuration", async ({
        page,
    }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "X/Y Line",
                settings: true,
                columns: ["Row ID", "Postal Code", null],
                group_by: [],
                split_by: ["Sub-Category", "Segment"],
            });
        });

        await page.hover(
            "#container > d3fc-group > d3fc-svg.svg-plot-area.plot-area > svg > g:nth-child(2) > g > g:nth-child(1) > g > path",
            {
                force: true,
            },
        );
        await page.waitForSelector("#tooltip-values > li:nth-child(3)");

        let tooltip_row_id_value = await page.evaluate(async () => {
            return document
                .querySelector("perspective-viewer-d3fc-xyline")
                ?.shadowRoot?.querySelector(
                    "#tooltip-values > li:nth-child(2) > b",
                )?.textContent;
        });

        expect(tooltip_row_id_value).toBeTruthy();
        expect(tooltip_row_id_value).toMatch(/^(?!NaN$|-$).+$/);
    });
});
