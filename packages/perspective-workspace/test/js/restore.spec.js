/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test } from "@playwright/test";
import {
    compareLightDOMContents,
    compareShadowDOMContents,
} from "@finos/perspective-test";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

function tests(context, compare) {
    test("restore workspace with detail only", async ({ page }) => {
        const config = {
            viewers: {
                One: { table: "superstore", name: "One" },
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

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-detail-only.txt`
        );
    });

    test("restore workspace with master and detail", async ({ page }) => {
        const config = {
            viewers: {
                One: {
                    table: "superstore",
                    name: "Test",
                    group_by: ["State"],
                    columns: ["Sales", "Profit"],
                },
                Two: { table: "superstore", name: "One" },
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

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-master-and-detail.txt`
        );
    });

    // This test flaps constantly due to mis-ordered HTML attributes and I don't
    // want to fix it for the value it provides.
    // test.skip("restore workspace with viewers with generated slotids", async (page) => {
    //     const config = {
    //         viewers: {
    //             PERSPECTIVE_GENERATED_ID_0: {
    //                 table: "superstore",
    //                 name: "Test",
    //                 group_by: ["State"],
    //                 columns: ["Sales", "Profit"],
    //             },
    //         },
    //         detail: {
    //             main: {
    //                 currentIndex: 0,
    //                 type: "tab-area",
    //                 widgets: ["PERSPECTIVE_GENERATED_ID_0"],
    //             },
    //         },
    //     };

    //     await page.evaluate(async (config) => {
    //         const workspace = document.getElementById("workspace");
    //         await workspace.restore(config);
    //     }, config);

    //     await page.evaluate(async () => {
    //         const workspace = document.getElementById("workspace").workspace;
    //         const widget = workspace.getAllWidgets()[0];
    //         await workspace.duplicate(widget);
    //     });

    //     await page.evaluate(async () => {
    //         await workspace.flush();
    //     });

    //     return extract(page);
    // });
}

test.describe("Workspace restore", () => {
    test.describe("Light DOM", () => {
        tests("light-dom", compareLightDOMContents);
    });

    test.describe("Shadow DOM", () => {
        tests("shadow-dom", compareShadowDOMContents);
    });
});

// utils.with_server({ paths: PATHS }, () => {
//     describe.page(
//         "index.html",
//         () => {
//             describe("Light DOM", () => {
//                 tests((page) =>
//                     page.evaluate(
//                         async () =>
//                             document.getElementById("workspace").outerHTML
//                     )
//                 );
//             });

//             describe("Shadow DOM", () => {
//                 tests((page) =>
//                     page.evaluate(
//                         async () =>
//                             document
//                                 .getElementById("workspace")
//                                 .shadowRoot.querySelector("#container")
//                                 .innerHTML
//                     )
//                 );
//             });
//         },
//         { root: TEST_ROOT }
//     );
// });
