/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
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

async function setupTestWorkspace(page) {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

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
}

test.describe("Workspace DOM", () => {
    test.describe("Light DOM", () => {
        test.describe("removeChild", () => {
            test("Remove One", async ({ page }) => {
                await setupTestWorkspace(page);

                await compareLightDOMContents(
                    page,
                    "workspace-light-remove-one-child.txt"
                );
            });
        });
    });

    test.describe("Shadow DOM", () => {
        test.describe("removeChild", () => {
            test("Remove One", async ({ page }) => {
                await setupTestWorkspace(page);

                await compareShadowDOMContents(
                    page,
                    "workspace-dark-remove-one-child.txt"
                );
            });
        });
    });
});
