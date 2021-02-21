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
        function() {
            test.capture("replaces all rows.", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
                const json = await page.evaluate(async element => {
                    let json = await element.view.to_json();
                    return json.slice(10, 20);
                }, viewer);
                expect(json.length).toEqual(10);
                await page.evaluate(
                    async (element, json) => {
                        element.table.replace(json);
                    },
                    viewer,
                    json
                );
                // FIXME This is due to update() not triggering flush() semantics
                await page.waitFor(1000);
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
