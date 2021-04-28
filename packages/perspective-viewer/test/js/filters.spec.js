/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

utils.with_server({}, () => {
    describe.page(
        "filters.html",
        () => {
            test.capture("autocomplete on date column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("filters", '[["v", "==", ""]]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("autocomplete on datetime column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("filters", '[["w", "==", ""]]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
            });

            test.capture("equals on date column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("filters", '[["v", "==", "11/1/2020"]]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("equals ISO string on datetime column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => {
                    const dt = new Date(2020, 11, 1, 23, 30, 55).toISOString();
                    element.setAttribute("filters", '[["w", "==", "' + dt + '"]]');
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("equals US locale string on datetime column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => {
                    element.setAttribute("filters", '[["w", "==", "12/01/2020, 11:30:55 PM"]]');
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("greater than on date column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("filters", '[["v", ">", "03/01/2020"]]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("greater than ISO string on datetime column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => {
                    const dt = new Date(2020, 9, 1, 15, 30, 55).toISOString();
                    element.setAttribute("filters", '[["w", ">", "' + dt + '"]]');
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("greater than US locale string on datetime column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => {
                    element.setAttribute("filters", '[["w", ">", "10/01/2020, 03:30:55 PM"]]');
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("less than on date column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => element.setAttribute("filters", '[["v", "<", "10/01/2020"]]'), viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("less than ISO string on datetime column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => {
                    const dt = new Date(2020, 9, 1, 15, 30, 55).toISOString();
                    element.setAttribute("filters", '[["w", "<", "' + dt + '"]]');
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });

            test.capture("less than US locale string on datetime column", async page => {
                const viewer = await page.$("perspective-viewer");
                await await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                await page.evaluate(element => {
                    element.setAttribute("filters", '[["w", "<", "10/01/2020, 03:30:55 PM"]]');
                }, viewer);
                await page.waitForSelector("perspective-viewer:not([updating])");
                await page.shadow_blur();
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
