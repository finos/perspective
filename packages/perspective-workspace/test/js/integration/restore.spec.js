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
    path.join(TEST_ROOT, "dist", "theme"),
    path.join(TEST_ROOT, "test", "html"),
    path.join(TEST_ROOT, "test", "css"),
    path.join(TEST_ROOT, "test", "csv"),
];

function tests(extract) {
    test.capture("restore workspace with detail only", async (page) => {
        await page.waitForFunction(() => !!window.__TABLE__);
        const config = {
            viewers: {
                One: {table: "superstore", name: "One"},
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        return extract(page);
    });

    test.capture("restore workspace with master and detail", async (page) => {
        const config = {
            viewers: {
                One: {
                    table: "superstore",
                    name: "Test",
                    row_pivots: ["State"],
                    columns: ["Sales", "Profit"],
                },
                Two: {table: "superstore", name: "One"},
            },
            master: {
                widgets: ["One"],
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["Two"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        return extract(page);
    });

    test.capture(
        "restore workspace with viewers with generated slotids",
        async (page) => {
            const config = {
                viewers: {
                    PERSPECTIVE_GENERATED_ID_0: {
                        table: "superstore",
                        name: "Test",
                        row_pivots: ["State"],
                        columns: ["Sales", "Profit"],
                    },
                },
                detail: {
                    main: {
                        currentIndex: 0,
                        type: "tab-area",
                        widgets: ["PERSPECTIVE_GENERATED_ID_0"],
                    },
                },
            };

            await page.evaluate(async (config) => {
                const workspace = document.getElementById("workspace");
                await workspace.restore(config);
            }, config);

            await page.evaluate(async () => {
                const workspace =
                    document.getElementById("workspace").workspace;
                const widget = workspace.getAllWidgets()[0];
                await workspace.duplicate(widget);
            });

            await page.evaluate(async () => {
                await workspace.flush();
            });

            return extract(page);
        }
    );
}

utils.with_server({paths: PATHS}, () => {
    describe.page(
        "index.html",
        () => {
            describe("Light DOM", () => {
                tests((page) =>
                    page.evaluate(
                        async () =>
                            document.getElementById("workspace").outerHTML
                    )
                );
            });

            describe("Shadow DOM", () => {
                tests((page) =>
                    page.evaluate(
                        async () =>
                            document
                                .getElementById("workspace")
                                .shadowRoot.querySelector("#container")
                                .innerHTML
                    )
                );
            });
        },
        {root: TEST_ROOT}
    );
});
