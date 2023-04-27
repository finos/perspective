/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { test, expect } = require("@playwright/test");
const path = require("path");
const { host } = require("../../src/js/index.js");

test.describe("CLI", function () {
    test("Tests something", async ({ page }) => {
        const options = { port: 0 };
        const server = await host(
            path.join(__dirname, "../csv/test.csv"),
            options
        );
        const port = server._server.address().port;

        await page.goto(`http://localhost:${port}/`);
        await page.waitForSelector(
            "perspective-viewer perspective-viewer-datagrid"
        );

        const json = await page.evaluate(async function () {
            const viewer = document.querySelector("perspective-viewer");
            const view = await viewer.getView();
            return await view.to_json();
        });

        expect(json).toEqual([
            { x: 1, y: 2 },
            { x: 3, y: 4 },
            { x: 5, y: 6 },
        ]);
        await page.close();
        server.close();
    });
});
