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
const {expectation} = require("sinon");

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
            test.capture(
                "restore() fires the 'perspective-config-update' event",
                async (page) => {
                    const config = await page.evaluate(async () => {
                        const viewer =
                            document.querySelector("perspective-viewer");
                        await viewer.getTable();
                        let config;
                        viewer.addEventListener(
                            "perspective-config-update",
                            (event) => {
                                config = event.detail;
                            }
                        );

                        await viewer.restore({
                            settings: true,
                            row_pivots: ["State"],
                            columns: ["Profit", "Sales"],
                        });

                        return config;
                    });

                    expect(config).toEqual({
                        aggregates: {},
                        column_pivots: [],
                        columns: ["Profit", "Sales"],
                        expressions: [],
                        filter: [],
                        row_pivots: ["State"],
                        sort: [],
                    });

                    return await get_contents(page);
                }
            );

            // TODO Only one plugin registered ...
            // need the ability to register plugins after a viewer is already
            // loaded to enable this test.
            test.skip("restore() with a 'plugin' field fires the 'perspective-plugin-update' event", async (page) => {
                const config = await page.evaluate(async () => {
                    const viewer = document.querySelector("perspective-viewer");
                    await viewer.getTable();
                    let config;
                    viewer.addEventListener(
                        "perspective-plugin-update",
                        (event) => {
                            config = "DID NOT FAIL";
                        }
                    );

                    await viewer.restore({
                        settings: true,
                        plugin: "Debug",
                        row_pivots: ["State"],
                    });
                    return config;
                });

                expect(config).toEqual("Debug");

                return await get_contents(page);
            });
        },
        {root: path.join(__dirname, "..", "..")}
    );
});
