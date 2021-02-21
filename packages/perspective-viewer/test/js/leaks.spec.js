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
                "doesn't leak elements.",
                async page => {
                    let viewer = await page.$("perspective-viewer");
                    await page.evaluate(viewer => {
                        window.__TABLE__ = viewer.table;
                    }, viewer);

                    for (var i = 0; i < 100; i++) {
                        viewer = await page.$("perspective-viewer");
                        await page.evaluate(async element => {
                            element.delete();
                            document.body.innerHTML = "<perspective-viewer></perspective-viewer>";
                            await document.getElementsByTagName("perspective-viewer")[0].load(window.__TABLE__);
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    }
                    await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                    await page.evaluate(async () =>
                        document.getElementsByTagName("perspective-viewer")[0].load(
                            window.__WORKER__.table(
                                window.__CSV__
                                    .split("\n")
                                    .slice(0, 10)
                                    .join("\n")
                            )
                        )
                    );
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {timeout: 60000}
            );

            test.capture(
                "doesn't leak views when setting row pivots.",
                async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                    for (var i = 0; i < 100; i++) {
                        await page.evaluate(element => {
                            let pivots = ["State", "City", "Segment", "Ship Mode", "Region", "Category"];
                            let start = Math.floor(Math.random() * pivots.length);
                            let length = Math.ceil(Math.random() * (pivots.length - start));
                            element.setAttribute("row-pivots", JSON.stringify(pivots.slice(start, length)));
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    }
                    await page.evaluate(element => element.setAttribute("row-pivots", '["Category"]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {timeout: 60000}
            );

            test.capture(
                "doesn't leak views when setting filters.",
                async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                    for (var i = 0; i < 100; i++) {
                        await page.evaluate(element => {
                            element.setAttribute("filters", JSON.stringify([["Sales", ">", Math.random() * 100 + 100]]));
                        }, viewer);
                        await page.waitForSelector("perspective-viewer:not([updating])");
                    }
                    await page.evaluate(element => element.setAttribute("filters", '[["Sales", "<", 10]]'), viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(() => document.activeElement.blur());
                },
                {timeout: 60000}
            );
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
