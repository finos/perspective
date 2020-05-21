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
        "superstore.html",
        () => {
            test.capture("scrolls vertically", async page => {
                const datagrid = await page.$("perspective-datagrid");
                await page.evaluate(element => {
                    element.scrollTop = 0;
                    element.scrollLeft = 0;
                }, datagrid);
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer[settings]");
                await page.evaluate(element => {
                    element.scrollTop = 300;
                }, datagrid);
                await page.evaluate(() => new Promise(window.requestIdleCallback));
            });

            test.capture("scrolls horizontally", async page => {
                const datagrid = await page.$("perspective-datagrid");
                await page.evaluate(element => {
                    element.scrollTop = 0;
                    element.scrollLeft = 0;
                }, datagrid);
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer[settings]");
                await page.evaluate(element => {
                    element.scrollLeft = 300;
                }, datagrid);
                await page.evaluate(() => new Promise(window.requestIdleCallback));
            });

            test.capture("scrolls both", async page => {
                const datagrid = await page.$("perspective-datagrid");
                await page.evaluate(element => {
                    element.scrollTop = 0;
                    element.scrollLeft = 0;
                }, datagrid);
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer[settings]");
                await page.evaluate(element => {
                    element.scrollTop = 300;
                    element.scrollLeft = 300;
                }, datagrid);
                await page.evaluate(() => new Promise(window.requestIdleCallback));
            });

            test.capture("scroll past horizontal max", async page => {
                const datagrid = await page.$("perspective-datagrid");
                await page.evaluate(element => {
                    element.scrollTop = 0;
                    element.scrollLeft = 0;
                }, datagrid);
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer[settings]");
                await page.evaluate(element => {
                    element.scrollLeft = element.scrollWidth;
                }, datagrid);
                await page.evaluate(() => new Promise(window.requestIdleCallback));
            });

            test.capture("scroll past vertical max", async page => {
                const datagrid = await page.$("perspective-datagrid");
                await page.evaluate(element => {
                    element.scrollTop = 0;
                    element.scrollLeft = 0;
                }, datagrid);
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer[settings]");
                await page.evaluate(element => {
                    element.scrollTop = element.scrollHeight;
                }, datagrid);
                await page.evaluate(() => new Promise(window.requestIdleCallback));
            });

            test.capture("resets scroll position when resized and scrolled to max corner", async page => {
                const datagrid = await page.$("perspective-datagrid");
                await page.evaluate(element => {
                    element.scrollTop = 0;
                    element.scrollLeft = 0;
                }, datagrid);
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer[settings]");
                await page.evaluate(element => {
                    element.scrollTop = element.scrollHeight;
                    element.scrollLeft = element.scrollWidth;
                }, datagrid);
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer:not([settings])");
                await page.evaluate(() => new Promise(window.requestIdleCallback));
            });
        },
        {reload_page: false, root: path.join(__dirname, "..", "..")}
    );
});
