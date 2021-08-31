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
    path.join(TEST_ROOT, "test", "csv")
];

utils.with_server({paths: PATHS}, () => {
    describe.page(
        "index.html",
        () => {
            describe("Light DOM", () => {
                tests(page => page.evaluate(async () => document.querySelector("perspective-workspace").outerHTML));
            });

            describe("Shadow DOM", () => {
                tests(page => page.evaluate(async () => document.querySelector("perspective-workspace").shadowRoot.querySelector("#container").innerHTML));
            });
        },
        {root: TEST_ROOT}
    );
});

function tests(extract) {
    test.capture("Create One", async page => {
        await page.waitForFunction(() => !!window.__TABLE__);
        await page.evaluate(async () => {
            document.body.innerHTML = `
                <perspective-workspace>
                    <perspective-viewer table="superstore"></perspective-viewer>
                </perspective-workspace>
            `;
            const workspace = document.body.querySelector("perspective-workspace");
            workspace.tables.set("superstore", window.__TABLE__);
            await workspace.flush();
        });

        return extract(page);
    });

    test.capture("Create Multiple", async page => {
        await page.evaluate(async () => {
            document.body.innerHTML = `
                <perspective-workspace>
                    <perspective-viewer table="superstore"></perspective-viewer>
                    <perspective-viewer table="superstore"></perspective-viewer>
                </perspective-workspace>
            `;
            const workspace = document.body.querySelector("perspective-workspace");
            workspace.tables.set("superstore", window.__TABLE__);
            await workspace.flush();
        });

        return extract(page);
    });

    test.capture("Create multiple with names", async page => {
        await page.evaluate(async () => {
            document.body.innerHTML = `
                <perspective-workspace>
                    <perspective-viewer name="Table 1" table="superstore"></perspective-viewer>
                    <perspective-viewer name="Table 2" table="superstore"></perspective-viewer>
                </perspective-workspace>
            `;
            const workspace = document.body.querySelector("perspective-workspace");
            workspace.tables.set("superstore", window.__TABLE__);
            await workspace.flush();
        });

        return extract(page);
    });
}
