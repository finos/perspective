/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@jpmorganchase/perspective-viewer/test/js/utils.js");

async function capture_update(page, viewer, body) {
    await page.evaluate(element => {
        element.addEventListener("perspective-view-update", () => {
            element.setAttribute("test-updated", true);
        });
    }, viewer);
    await body();
    await page.waitFor(element => element.hasAttribute("test-updated"), {}, viewer);
    await page.evaluate(element => element.removeAttribute("test-updated"), viewer);
}

utils.with_server({}, () => {
    describe.page("regressions.html", () => {
        describe("Updates", () => {
            test.capture("regular updates", async page => {
                await page.click("#config_button");
                const viewer = await page.$("perspective-viewer");
                await capture_update(page, viewer, () => page.evaluate(element => element.update([{x: 3, y: "Updated!"}]), viewer));
                await page.waitFor("perspective-viewer:not([updating])");
            });

            test.capture("saving a computed column does not interrupt update rendering", async page => {
                await page.click("#config_button");
                const viewer = await page.$("perspective-viewer");
                await page.click("#add-computed-column");
                await page.$eval("perspective-computed-column", element => {
                    const columns = [{name: "y", type: "string"}];
                    element._apply_state(columns, element.computations["length"], "new_cc");
                });
                await page.click("#psp-cc-button-save");
                await page.waitForSelector("perspective-viewer:not([updating])");
                await capture_update(page, viewer, () => page.evaluate(element => element.update([{x: 3, y: "Updated!"}]), viewer));
            });
        });
    });
});
