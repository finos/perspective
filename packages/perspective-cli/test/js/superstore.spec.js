/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const puppeteer = require("puppeteer");

const { host } = require("../../src/js/index.js");

describe("CLI", function () {
    it("Tests something", async () => {
        const options = { port: 0 };
        const server = await host("test/csv/test.csv", options);
        const port = server._server.address().port;

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
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
        await browser.close();
        await new Promise((x) => setTimeout(x));
        server.close();
    });
});
