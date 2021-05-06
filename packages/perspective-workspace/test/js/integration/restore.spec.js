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
                        viewers: {
                            One: {id: "viewer", table: "superstore", name: "One"}
                        },
                        detail: {
                            main: {
                                currentIndex: 0,
                                type: "tab-area",
                                widgets: ["One"]
                            }
                        }
                    };

                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
                },
                {timeout: 30000}
            );

            test.capture(
                "restore workspace with master only",

                async page => {
                    const config = {
                        viewers: {
                            One: {table: "superstore", name: "Test", "row-pivots": ["State"], columns: ["Sales", "Profit"]}
                        },
                        master: {
                            widgets: ["One"]
                        }
                    };

                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
                },
                {timeout: 30000}
            );

            test.capture(
                "restore workspace with master and detail",

                async page => {
                    const config = {
                        viewers: {
                            One: {table: "superstore", name: "Test", "row-pivots": ["State"], columns: ["Sales", "Profit"]},
                            Two: {id: "viewer", table: "superstore", name: "One"}
                        },
                        master: {
                            widgets: ["One"]
                        },
                        detail: {
                            main: {
                                currentIndex: 0,
                                type: "tab-area",
                                widgets: ["Two"]
                            }
                        }
                    };

                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
                },
                {timeout: 30000}
            );

            test.capture(
                "restore workspace with viewers with generated slotids",

                async page => {
                    const config = {
                        viewers: {
                            PERSPECTIVE_GENERATED_ID_0: {table: "superstore", name: "Test", "row-pivots": ["State"], columns: ["Sales", "Profit"]}
                        },
                        detail: {
                            main: {
                                currentIndex: 0,
                                type: "tab-area",
                                widgets: ["PERSPECTIVE_GENERATED_ID_0"]
                            }
                        }
                    };

                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);

                    await page.evaluate(() => {
                        const workspace = document.getElementById("workspace").workspace;
                        const widget = workspace.getAllWidgets()[0];
                        workspace.duplicate(widget);
                    });

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
                },
                {timeout: 30000}
            );
        },
        {root: TEST_ROOT}
    );
});
