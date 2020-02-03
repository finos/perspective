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
        "selectable.html",
        () => {
            describe("no pivots", () => {
                describe("selecting a row", () => {
                    test.capture("highlights the row with no pivots", async page => {
                        await page.waitForSelector("perspective-viewer:not([updating])");
                        await page.$("perspective-viewer");
                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);
                        await page.mouse.move(80, 40);
                        await page.evaluate(async () => await document.querySelector("perspective-viewer").notifyResize());
                    });

                    test.capture("keeps selection when row moves with no pivots", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("sort", '[["number", "asc"]]');
                        }, viewer);

                        await page.waitForSelector("perspective-viewer:not([updating])");

                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);
                        await page.evaluate(async () => await document.querySelector("perspective-viewer").notifyResize());

                        await page.evaluate(element => {
                            element.update([{name: "Homer", number: 300}]);
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    });
                    test.capture("selection state can be set from restore api", async page => {
                        await page.waitForSelector("perspective-viewer:not([updating])");
                        await page.$("perspective-viewer");
                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);

                        await page.evaluate(async () => await document.querySelector("perspective-viewer").notifyResize());

                        let config = await page.evaluate(() => document.querySelector("perspective-viewer").save());
                        expect(config.plugin_config.selected).toBe("Marge");

                        await page.evaluate(async () => {
                            const viewer = document.querySelector("perspective-viewer");
                            await viewer.restore({plugin_config: {selected: "Homer"}});
                            await viewer.notifyResize();
                        });

                        config = await page.evaluate(() => document.querySelector("perspective-viewer").save());
                        expect(config.plugin_config.selected).toBe("Homer");
                    });
                });
            });
            describe("row pivots", () => {
                describe("selecting a row", () => {
                    test.capture("highlights the row with row pivots", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("row-pivots", '["name"]');
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");

                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);
                        await page.mouse.move(80, 40);

                        let config = await page.evaluate(() => document.querySelector("perspective-viewer").save());
                        expect(config.plugin_config.selected).toBe("Homer");

                        await page.evaluate(async () => await document.querySelector("perspective-viewer").notifyResize());
                    });

                    test.capture("keeps selection when row moves with row pivots", async page => {
                        const viewer = await page.$("perspective-viewer");
                        await page.evaluate(element => {
                            element.setAttribute("sort", '[["number", "asc"]]');
                            element.setAttribute("row-pivots", '["name"]');
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);
                        await page.evaluate(async () => await document.querySelector("perspective-viewer").notifyResize());
                        await page.evaluate(element => {
                            element.update([{name: "Homer", number: 300}]);
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    });

                    test.capture("selection state can be set from restore api", async page => {
                        await page.waitForSelector("perspective-viewer:not([updating])");
                        await page.$("perspective-viewer");
                        await page.focus("perspective-viewer");
                        await page.mouse.click(80, 60);
                        await page.evaluate(async () => await document.querySelector("perspective-viewer").notifyResize());

                        let config = await page.evaluate(() => document.querySelector("perspective-viewer").save());
                        expect(config.plugin_config.selected).toBe("Marge");

                        await page.evaluate(async () => {
                            const viewer = document.querySelector("perspective-viewer");
                            await viewer.restore({plugin_config: {selected: "Homer"}});
                            await viewer.notifyResize();
                        });

                        config = await page.evaluate(() => document.querySelector("perspective-viewer").save());
                        expect(config.plugin_config.selected).toBe("Homer");
                    });
                });
            });
        },
        {reload_page: true, root: path.join(__dirname, "..", "..")}
    );
});
