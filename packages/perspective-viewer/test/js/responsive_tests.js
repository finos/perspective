/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

exports.default = function() {
    const viewport = {
        height: 400,
        width: 600
    };

    // must specify timeout AND viewport
    test.capture(
        "shows horizontal columns on small viewports.",
        async page => {
            const viewer = await page.$("perspective-viewer");
            await page.shadow_click("perspective-viewer", "#config_button");
            await page.evaluate(element => element.setAttribute("columns", '["Discount","Profit","Sales"]'), viewer);
        },
        {timeout: 60000, viewport}
    );
};
