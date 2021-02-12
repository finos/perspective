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
// const cloneDeep = require("clone-deep");
const cloneDeep = require("lodash.clonedeep");

const TEST_ROOT = path.join(__dirname, "..", "..", "..");
const PATHS = [
    path.join(TEST_ROOT, "dist", "umd"),
    path.join(TEST_ROOT, "dist", "themes"),
    path.join(TEST_ROOT, "test", "html"),
    path.join(TEST_ROOT, "test", "css"),
    path.join(TEST_ROOT, "test", "csv")
];

const config = {
    mode: "linked",
    viewers: {
        Linked: {id: "viewer", table: "superstore", name: "Linked", linked: true, columns: ["State"]},
        Unlinked: {id: "viewer", table: "superstore", name: "Unlinked", "row-pivots": ["State"]}
    },
    detail: {
        main: {
            type: "split-area",
            orientation: "horizontal",
            children: [
                {
                    type: "tab-area",
                    widgets: ["Unlinked"],
                    currentIndex: 0
                },
                {
                    type: "tab-area",
                    widgets: ["Linked"],
                    currentIndex: 0
                }
            ],
            sizes: [0.5, 0.5]
        }
    }
};

utils.with_server({paths: PATHS}, () => {
    describe.page(
        "index.html",
        () => {
            test.capture(
                "restore workspace in linked mode",

                async page => {
                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, config);

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
                    await page.mouse.click(80, 100);
                    await page.waitFor(1000);
                },
                {timeout: 30000}
            );
            test.capture(
                "selection is disabled if no linked viewers",

                async page => {
                    const testConfig = cloneDeep(config);
                    testConfig.viewers.Linked.linked = false;
                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, testConfig);

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
                    await page.mouse.click(80, 100);
                    await page.waitFor(1000);
                },
                {timeout: 30000}
            );
            test.capture(
                "selection is disabled if grid has no row-pivots",

                async page => {
                    const testConfig = cloneDeep(config);
                    testConfig.viewers.Unlinked["row-pivots"] = null;
                    await page.evaluate(config => {
                        const workspace = document.getElementById("workspace");
                        workspace.restore(config);
                    }, testConfig);

                    while ((await page.$$("perspective-workspace > perspective-viewer[updating]")).length > 0);
                    await page.mouse.click(80, 100);
                    await page.waitFor(1000);
                },
                {timeout: 30000}
            );
        },
        {root: TEST_ROOT}
    );
});
