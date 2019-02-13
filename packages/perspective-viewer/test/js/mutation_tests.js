/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

exports.default = function() {
    test.capture("replaces all rows.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.shadow_click("perspective-viewer", "#config_button");
        const json = await page.evaluate(async element => {
            let json = await element.view.to_json();
            return json.slice(10, 20);
        }, viewer);
        expect(json.length).toEqual(10);
        await page.evaluate(
            async (element, json) => {
                element.replace(json);
            },
            viewer,
            json
        );
        // FIXME This is due to update() not triggering flush() semantics
        await page.waitFor(1000);
    });
};
