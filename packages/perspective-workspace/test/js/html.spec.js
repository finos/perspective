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

async function createOneWorkspace(page) {
    // await new Promise((x) => setTimeout(x, 2000));
    await page.evaluate(async () => {
        document.querySelector("perspective-workspace").innerHTML = `
            <perspective-viewer table="superstore"></perspective-viewer>
        `;

        const workspace = document.body.querySelector("perspective-workspace");

        workspace.tables.set("superstore", window.__TABLE__);

        await workspace.flush();
    });
}

async function createMultipleViewers(page) {
    await page.evaluate(async () => {
        document.querySelector("perspective-workspace").innerHTML = `
            <perspective-viewer table="superstore"></perspective-viewer>
            <perspective-viewer table="superstore"></perspective-viewer>
        `;

        const workspace = document.body.querySelector("perspective-workspace");

        // workspace.tables.set("superstore", window.__TABLE__);

        await workspace.flush();
    });
}

async function createMultipleViewersWithNames(page) {
    await page.evaluate(async () => {
        document.querySelector("perspective-workspace").innerHTML = `
            <perspective-viewer name="Table 1" table="superstore"></perspective-viewer>
            <perspective-viewer name="Table 2" table="superstore"></perspective-viewer>
        `;

        const workspace = document.body.querySelector("perspective-workspace");

        // workspace.tables.set("superstore", window.__TABLE__);

        await workspace.flush();
    });
}

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

test.describe("Workspace HTML", () => {
    test.describe("Light DOM", () => {
        test("Create One", async ({ page }) => {
            await createOneWorkspace(page);

            await compareLightDOMContents(
                page,
                "workspace-html-light-create-one.txt"
            );
        });

        test("Create Multiple", async ({ page }) => {
            await createMultipleViewers(page);

            await compareLightDOMContents(
                page,
                "workspace-html-light-create-multiple.txt"
            );
        });

        test("Create Multiple with names", async ({ page }) => {
            await createMultipleViewersWithNames(page);

            await compareLightDOMContents(
                page,
                "workspace-html-light-create-multiple-with-names.txt"
            );
        });
    });

    test.describe("Shadow DOM", () => {
        test("Create One", async ({ page }) => {
            await createOneWorkspace(page);

            await compareShadowDOMContents(
                page,
                "workspace-html-shadow-create-one.txt"
            );
        });

        test("Create Multiple", async ({ page }) => {
            await createMultipleViewers(page);

            await compareShadowDOMContents(
                page,
                "workspace-html-shadow-create-multiple.txt"
            );
        });

        test("Create Multiple with names", async ({ page }) => {
            await createMultipleViewersWithNames(page);

            await compareShadowDOMContents(
                page,
                "workspace-html-shadow-create-multiple-with-names.txt"
            );
        });
    });
});
