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

utils.with_server({ paths: PATHS }, () => {
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
        { root: TEST_ROOT }
    );
});

function tests(extract) {
    describe("removeChild", () => {
        test.capture("Remove One", async (page) => {
            await page.waitForFunction(() => !!window.__TABLE__);
            await page.evaluate(async () => {
                const viewer = document.createElement("perspective-viewer");
                viewer.setAttribute("table", "superstore");
                viewer.setAttribute("name", "one");
                viewer.setAttribute("slot", "one");
                const viewer2 = document.createElement("perspective-viewer");
                viewer2.setAttribute("table", "superstore");
                viewer2.setAttribute("name", "two");
                viewer2.setAttribute("slot", "two");
                const workspace = document.getElementById("workspace");
                workspace.appendChild(viewer);
                workspace.appendChild(viewer2);
                await workspace.flush();
            });

            await page.evaluate(async () => {
                const viewer = document.body.querySelector(
                    'perspective-viewer[name="one"]'
                );
                const workspace = document.getElementById("workspace");
                workspace.removeChild(viewer);
                await workspace.flush();
            });

            return extract(page);
        });
    });

    // describe("appendChild", () => {
    // test.capture("Create One", async page => {
    //     await page.evaluate(async () => {
    //         const viewer = document.createElement("perspective-viewer");
    //         viewer.setAttribute("table", "superstore");
    //         viewer.setAttribute("slot", "one");
    //         const workspace = document.getElementById("workspace");
    //         workspace.appendChild(viewer);
    //         await workspace.flush();
    //     });
    //     return extract(page);
    // });
    //     test.capture(
    //         "Create multiple",
    //         async page => {
    //             await page.evaluate(() => {
    //                 const viewer = document.createElement("perspective-viewer");
    //                 viewer.setAttribute("table", "superstore");
    //                 viewer.setAttribute("slot", "one");
    //                 const viewer2 = document.createElement("perspective-viewer");
    //                 viewer2.setAttribute("table", "superstore");
    //                 viewer2.setAttribute("slot", "two");
    //                 const workspace = document.getElementById("workspace");
    //                 workspace.appendChild(viewer);
    //                 workspace.appendChild(viewer2);
    //             });
    //             while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
    //         },
    //         {timeout: 30000}
    //     );
    //     test.capture(
    //         "With name",
    //         async page => {
    //             await page.evaluate(() => {
    //                 const viewer = document.createElement("perspective-viewer");
    //                 viewer.setAttribute("table", "superstore");
    //                 viewer.setAttribute("name", "One");
    //                 viewer.setAttribute("slot", "one");
    //                 const workspace = document.getElementById("workspace");
    //                 workspace.appendChild(viewer);
    //             });
    //             while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
    //         },
    //         {timeout: 30000}
    //     );
    //     test.capture(
    //         "Without slot",
    //         async page => {
    //             await page.evaluate(() => {
    //                 const viewer = document.createElement("perspective-viewer");
    //                 viewer.setAttribute("table", "superstore");
    //                 const workspace = document.getElementById("workspace");
    //                 workspace.appendChild(viewer);
    //             });
    //             while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
    //         },
    //         {timeout: 30000}
    //     );
    // });
}
