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
        "resize.html",
        () => {
            test.capture(
                "Config should show by default",
                async page => {
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.waitForSelector("perspective-viewer[settings]");
                },
                {}
            );

            test.capture(
                "Resize the container causes the widget to resize",
                async page => {
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(async () => {
                        document.querySelector(".PSPContainer").style = "position:absolute;top:0;left:0;width:300px;height:300px";
                        await document.querySelector("perspective-viewer").notifyResize();
                    });

                    await page.evaluate(async () => {
                        document.querySelector(".PSPContainer").style = "position:absolute;top:0;left:0;width:800px;height:600px";
                        await document.querySelector("perspective-viewer").notifyResize();
                    });
                },
                {}
            );

            test.capture(
                "row_pivots traitlet works",
                async page => {
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                    await page.evaluate(() => {
                        window.__WIDGET__.row_pivots = ["State"];
                    });
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {}
            );
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
