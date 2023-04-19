/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import { compareSVGContentsToSnapshot } from "@finos/perspective-test";

test.describe("Events test", () => {
    test("perspective-config-update event is fired when series axis is changed", async ({
        page,
    }) => {
        await page.goto("/@finos/perspective-test/src/html/basic-test.html", {
            waitUntil: "networkidle",
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "Y Line",
                columns: ["Sales", "Profit"],
            });
        });

        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");

            // @ts-ignore
            window.__series_events__ = [];

            // @ts-ignore
            viewer.addEventListener("perspective-config-update", (evt) => {
                // @ts-ignore
                window.__series_events__.push(evt);
            });
        });

        // @ts-ignore
        const axisLabel = (
            await page.waitForFunction(() =>
                document
                    .querySelector("perspective-viewer-d3fc-yline")!
                    .shadowRoot!.querySelector(".y-label .splitter-label")
            )
        ).asElement();

        // @ts-ignore
        await axisLabel?.click(axisLabel);

        const count = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            // Await the plugin rendering
            // @ts-ignore
            await viewer.flush();

            // Count the events;
            // @ts-ignore
            return window.__series_events__.length;
        });

        // Expect 1 event
        expect(count).toEqual(1);

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-yline",
            ["config-events.txt"]
        );
    });

    test("perspective-config-update event is fired when legend position is changed", async ({
        page,
    }) => {
        await page.goto("/@finos/perspective-test/src/html/basic-test.html", {
            waitUntil: "networkidle",
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "Y Line",
                columns: ["Sales", "Profit"],
            });
        });

        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");

            // @ts-ignore
            window.__legend_events__ = [];
            viewer?.addEventListener("perspective-config-update", (evt) => {
                // @ts-ignore
                window.__legend_events__.push(evt);
            });
        });

        const legend = (
            await page.waitForFunction(() =>
                // @ts-ignore
                document
                    .querySelector("perspective-viewer-d3fc-yline")
                    .shadowRoot.querySelector(".legend-container")
            )
        ).asElement();

        const boundingBox = await legend?.boundingBox();

        const start = {
            // @ts-ignore
            x: boundingBox.x + boundingBox.width / 2,
            // @ts-ignore
            y: boundingBox.y + boundingBox.height / 2,
        };

        const target = {
            x: start.x - 300,
            y: start.y,
        };

        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(target.x, target.y);
        await page.mouse.up();

        const count = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            // Await the plugin rendering
            // @ts-ignore
            await viewer.flush();

            // Count the events;
            // @ts-ignore
            return window.__legend_events__.length;
        });

        expect(count).toBeGreaterThan(0);

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-yline",
            ["legend-events.txt"]
        );
    });
});
