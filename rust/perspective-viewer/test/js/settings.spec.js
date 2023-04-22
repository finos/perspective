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
    compareContentsToSnapshot,
    shadow_click,
    shadow_type,
} from "@finos/perspective-test";

const path = require("path");

async function get_contents(page) {
    return await page.evaluate(async () => {
        const viewer = document
            .querySelector("perspective-viewer")
            .shadowRoot.querySelector("#app_panel");
        return viewer ? viewer.innerHTML : "MISSING";
    });
}

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html", {
        waitUntil: "networkidle",
    });

    await page.evaluate(async () => {
        await document.querySelector("perspective-viewer").restore({
            plugin: "Debug",
        });
    });
});

test.describe("Settings", () => {
    test("opens settings when field is set to true", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.getTable();
            await viewer.restore({ settings: true });
        });

        const contents = await get_contents(page);

        await compareContentsToSnapshot(contents, [
            "opens-settings-when-field-is-set-to-true.txt",
        ]);
    });

    test("opens settings when field is set to false", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.getTable();
            await viewer.restore({ settings: false });
        });

        const contents = await get_contents(page);

        await compareContentsToSnapshot(contents, [
            "opens-settings-when-field-is-set-to-false.txt",
        ]);
    });
});
