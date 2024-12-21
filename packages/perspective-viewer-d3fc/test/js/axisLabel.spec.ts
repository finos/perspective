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

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/basic-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

    await page.evaluate(async () => {
        let viewer = document.querySelector("perspective-viewer");
        await viewer!.restore({
            plugin: "Datagrid",
            group_by: ["Order Date", "Profit"],
            x_axis: ["Row ID"],
        });

        return await viewer.save();
    });

    await page.click("#settings_button");
    await page.click(".plugin-select-item");
});

function confirmDateData(dateValues: any[]) {
    // expect the first to be a date.
    expect(!isNaN(Date.parse(dateValues[0]))).toEqual(true);

    // expect any random index of axisLabels to also be a date.
    let len = dateValues.length;
    const index = Math.floor(Math.random() * len);

    expect(!isNaN(Date.parse(dateValues[index]))).toEqual(true);

    // expect the last value to be a date.

    expect(!isNaN(Date.parse(dateValues[len - 1]))).toEqual(true);

    /**
     * To confirm that the date string is not in epoch format.
     * check if the entire string is numeric.
     * if it is, confirm that the length is not 10 or 13.
     * if it is not, return true.
     */
    let isNumericOnly = /^\d+$/.test(dateValues[index]);

    expect(isNumericOnly).toEqual(false);
}

test.describe("Axis Values With Grouped Data With A Date Field In The Group", () => {
    test("X Bar y-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="X Bar"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-xbar`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.y-axis.left-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });

    test("Y Bar x-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="Y Bar"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-ybar`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.x-axis.bottom-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });

    test("OHLC x-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="OHLC"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-ohlc`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.x-axis.bottom-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });

    test("Heatmap x-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="Heatmap"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-heatmap`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.x-axis.bottom-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });

    test("Y Line x-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="Y Line"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-yline`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.x-axis.bottom-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });

    test("Y Area x-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="Y Area"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-yarea`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.x-axis.bottom-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });

    test("Y Scatter x-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="Y Scatter"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-yscatter`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.x-axis.bottom-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });

    test("CandleStick x-axis label with grouped data", async ({ page }) => {
        await page.click('div[data-plugin="Candlestick"]');
        await page.waitForSelector("perspective-viewer");

        const dateValues = await page.evaluate(async () => {
            let viewer = document.querySelector("perspective-viewer");

            if (!viewer) return [];

            const plugin_element = viewer.querySelector(
                `perspective-viewer-d3fc-candlestick`
            );

            if (!plugin_element) return [];

            const shadowRoot = plugin_element.shadowRoot;
            const elements = shadowRoot.querySelectorAll(
                "div d3fc-group d3fc-svg.x-axis.bottom-axis svg, g.group"
            );

            // By how the data is grouped, the date values are the last in the array.
            const lastGroup = elements[elements.length - 1];

            const dateTextElements = lastGroup.querySelectorAll("g.tick text");

            // collect and return the actual date data to be used.
            return Array.from(dateTextElements).map((el) =>
                el.textContent?.trim()
            );
        });

        confirmDateData(dateValues);
    });
});
