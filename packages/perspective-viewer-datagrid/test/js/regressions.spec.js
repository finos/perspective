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
const {capture_update} = require("./utils.js");

utils.with_server({}, () => {
    describe.page(
        "empty.html",
        () => {
            test.capture("empty grids do not explode", async page => {
                const viewer = await page.$("perspective-viewer");
                await page.shadow_click("perspective-viewer", "#config_button");
                await page.waitFor("perspective-viewer:not([updating])");
                await capture_update(page, viewer, () => page.evaluate(element => element.update([{x: 3}]), viewer));
                await page.waitFor("perspective-viewer:not([updating])");
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );

    describe.page(
        "regressions.html",
        () => {
            describe("Updates", () => {
                test.capture("should not render an extra row for column_only views", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.setAttribute("column-pivots", '["y"]'), viewer);
                });

                test.capture("regular updates", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await capture_update(page, viewer, () => page.evaluate(element => element.update([{x: 3, y: "Updated!"}]), viewer));
                    await page.waitFor("perspective-viewer:not([updating])");
                });

                test.capture("saving a computed expression column does not interrupt update rendering", async page => {
                    const viewer = await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.evaluate(element => element.shadowRoot.querySelector("#add-computed-expression").click(), viewer);
                    await page.shadow_type('length("y") as "new_cc"', "perspective-viewer", "perspective-computed-expression-editor", "#psp-expression-input");
                    await page.evaluate(element => {
                        const editor = element.shadowRoot.querySelector("perspective-computed-expression-editor");
                        const button = editor.shadowRoot.querySelector("#psp-expression-button-save");
                        button.removeAttribute("disabled");
                        button.click();
                    }, viewer);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await capture_update(page, viewer, () => page.evaluate(element => element.update([{x: 3, y: "Updated!"}]), viewer));
                });
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
