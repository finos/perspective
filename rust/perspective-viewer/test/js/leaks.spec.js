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

                    return await page.evaluate(async () => {
                        const element =
                            document.querySelector("perspective-viewer");
                        await element.toggleConfig();
                        return element.innerHTML;
                    });
                },
                {timeout: 60000}
            );

            test.capture(
                "doesn't leak views when setting row pivots",
                async (page) => {
                    let viewer = await page.$("perspective-viewer");
                    await page.evaluate(async (viewer) => {
                        window.__TABLE__ = await viewer.getTable();
                        await viewer.reset();
                    }, viewer);

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
                                row_pivots: pivots.slice(start, length),
                            });
                        }, viewer);
                    }

                    return await page.evaluate(async (viewer) => {
                        await viewer.restore({row_pivots: ["State"]});
                        await viewer.toggleConfig();
                        return viewer.innerHTML;
                    }, viewer);
                },
                {timeout: 60000}
            );

            test.capture(
                "doesn't leak views when setting filters",
                async (page) => {
                    let viewer = await page.$("perspective-viewer");
                    await page.evaluate(async (viewer) => {
                        window.__TABLE__ = await viewer.getTable();
                        await viewer.reset();
                    }, viewer);

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

                    return await page.evaluate(async (viewer) => {
                        await viewer.restore({filter: [["Sales", "<", 10]]});
                        await viewer.toggleConfig();
                        return viewer.innerHTML;
                    }, viewer);
                },
                {timeout: 60000}
            );
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
