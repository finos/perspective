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

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            test.capture("not_in filter works correctly", async (page) => {
                await page.evaluate(async () => {
                    const viewer = document.querySelector("perspective-viewer");
                    await viewer.restore({
                        group_by: ["State"],
                        columns: ["Sales"],
                        settings: true,
                        filter: [
                            [
                                "State",
                                "not in",
                                ["California", "Texas", "New York"],
                            ],
                        ],
                    });
                });

                return await get_contents(page);
            });
        },
        { root: path.join(__dirname, "..", "..") }
    );
});
