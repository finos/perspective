/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

exports.default = function() {
    // must specify timeout AND viewport
    test.capture(
        "shows horizontal columns on small vertical viewports.",
        async page => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            await page.evaluate(element => element.setAttribute("columns", '["Discount","Profit","Sales"]'), viewer);
        },
        {
            timeout: 60000,
            viewport: {
                height: 400,
                width: 800
            }
        }
    );

    test.capture(
        "shows horizontal columns on small vertical and horizontal viewports.",
        async page => {
            const viewer = await page.$("perspective-viewer");
            await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            await page.evaluate(element => element.setAttribute("columns", '["Discount","Profit","Sales"]'), viewer);
        },
        {
            timeout: 60000,
            viewport: {
                height: 400,
                width: 500
            }
        }
    );
};
