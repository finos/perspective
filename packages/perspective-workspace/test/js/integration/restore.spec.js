/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

const TEST_ROOT = path.join(__dirname, "..", "..", "..");
const PATHS = [
    path.join(TEST_ROOT, "dist", "umd"),
    path.join(TEST_ROOT, "dist", "themes"),
    path.join(TEST_ROOT, "test", "html"),
    path.join(TEST_ROOT, "test", "css"),
    path.join(TEST_ROOT, "test", "csv")
];

utils.with_server({paths: PATHS}, () => {
    describe.page(
        "index.html",
        () => {
            test.capture(
                "restore workspace with detail only",

                async page => {
                    const config = {
                        detail: {
                            main: {
                                currentIndex: 0,
                                type: "tab-area",
                                widgets: [{id: "viewer", table: "superstore", name: "One"}]
                            }
                        }
                    };

                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    await page.waitForSelector("perspective-workspace > perspective-viewer:not([updating])");
                },
                {wait_for_update: false, timeout: 30000}
            );

            test.capture(
                "restore workspace with master only",

                async page => {
                    const config = {
                        master: {
                            widgets: [{table: "superstore", name: "Test", "row-pivots": ["State"], columns: ["Sales", "Profit"]}]
                        }
                    };

                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    await page.waitForSelector("perspective-workspace > perspective-viewer:not([updating])");
                },
                {wait_for_update: false, timeout: 30000}
            );

            test.capture(
                "restore workspace with master and detail",

                async page => {
                    const config = {
                        master: {
                            widgets: [{table: "superstore", name: "Test", "row-pivots": ["State"], columns: ["Sales", "Profit"]}]
                        },
                        detail: {
                            main: {
                                currentIndex: 0,
                                type: "tab-area",
                                widgets: [{id: "viewer", table: "superstore", name: "One"}]
                            }
                        }
                    };

                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    await page.waitForSelector("perspective-workspace > perspective-viewer:not([updating])");
                },
                {wait_for_update: false, timeout: 30000}
            );
        },
        {root: TEST_ROOT}
    );
});
