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
            test.capture(
                "doesn't leak elements",
                async (page) => {
                    let viewer = await page.$("perspective-viewer");
                    await page.evaluate(async (viewer) => {
                        window.__TABLE__ = await viewer.getTable();
                        await viewer.reset();
                    }, viewer);

                    // From a helpful blog
                    // https://media-codings.com/articles/automatically-detect-memory-leaks-with-puppeteer
                    await page.evaluate(() => window.gc());
                    const { JSHeapUsedSize: heap1 } = await page.metrics();

                    for (var i = 0; i < 500; i++) {
                        await page.evaluate(async () => {
                            const element =
                                document.querySelector("perspective-viewer");

                            await element.delete();
                            document.body.innerHTML =
                                "<perspective-viewer></perspective-viewer>";

                            const new_element =
                                document.querySelector("perspective-viewer");

                            await new_element.load(
                                Promise.resolve(window.__TABLE__)
                            );
                        });
                    }

                    // TODO this is very generous memory allowance suggests we
                    // leak ~0.1% per instance.
                    await page.evaluate(() => window.gc());
                    const { JSHeapUsedSize: heap2 } = await page.metrics();
                    expect((heap2 - heap1) / heap1).toBeLessThan(0.5);

                    return await page.evaluate(async () => {
                        const element =
                            document.querySelector("perspective-viewer");
                        await element.toggleConfig();
                        return element.innerHTML;
                    });
                },
                { timeout: 120000 }
            );

            test.capture(
                "doesn't leak views when setting group by",
                async (page) => {
                    let viewer = await page.$("perspective-viewer");
                    await page.evaluate(async (viewer) => {
                        window.__TABLE__ = await viewer.getTable();
                        await viewer.reset();
                    }, viewer);

                    await page.evaluate(() => window.gc());
                    const { JSHeapUsedSize: heap1 } = await page.metrics();

                    for (var i = 0; i < 500; i++) {
                        await page.evaluate(async (element) => {
                            await element.reset();
                            let pivots = [
                                "State",
                                "City",
                                "Segment",
                                "Ship Mode",
                                "Region",
                                "Category",
                            ];
                            let start = Math.floor(
                                Math.random() * pivots.length
                            );
                            let length = Math.ceil(
                                Math.random() * (pivots.length - start)
                            );
                            await element.restore({
                                group_by: pivots.slice(start, length),
                            });
                        }, viewer);
                    }

                    await page.evaluate(() => window.gc());
                    const { JSHeapUsedSize: heap2 } = await page.metrics();
                    expect((heap2 - heap1) / heap1).toBeLessThan(0.1);

                    return await page.evaluate(async (viewer) => {
                        await viewer.restore({ group_by: ["State"] });
                        await viewer.toggleConfig();
                        return viewer.innerHTML;
                    }, viewer);
                },
                { timeout: 120000 }
            );

            test.capture(
                "doesn't leak views when setting filters",
                async (page) => {
                    let viewer = await page.$("perspective-viewer");
                    await page.evaluate(async (viewer) => {
                        window.__TABLE__ = await viewer.getTable();
                        await viewer.reset();
                    }, viewer);

                    await page.evaluate(() => window.gc());
                    const { JSHeapUsedSize: heap1 } = await page.metrics();

                    for (var i = 0; i < 500; i++) {
                        await page.evaluate(async (element) => {
                            await element.reset();
                            await element.restore({
                                filter: [
                                    ["Sales", ">", Math.random() * 100 + 100],
                                ],
                            });
                        }, viewer);
                    }

                    await page.evaluate(() => window.gc());
                    const { JSHeapUsedSize: heap2 } = await page.metrics();
                    expect((heap2 - heap1) / heap1).toBeLessThan(0.05);

                    return await page.evaluate(async (viewer) => {
                        await viewer.restore({ filter: [["Sales", "<", 10]] });
                        await viewer.toggleConfig();
                        return viewer.innerHTML;
                    }, viewer);
                },
                { timeout: 120000 }
            );
        },
        { root: path.join(__dirname, "..", "..") }
    );
});
