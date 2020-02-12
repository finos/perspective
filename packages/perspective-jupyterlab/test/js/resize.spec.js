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
                "Basic widget functions",
                async page => {
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {wait_for_update: false}
            );

            test.capture(
                "row_pivots traitlet works",
                async page => {
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(() => {
                        window.__WIDGET__.row_pivots = ["State"];
                    });
                    await page.waitForSelector("perspective-viewer:not([updating])");
                },
                {wait_for_update: false}
            );
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
