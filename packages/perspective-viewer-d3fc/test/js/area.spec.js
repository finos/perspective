/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

// const utils = require("@finos/perspective-test");
const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");
const utils = require("@finos/perspective-test");

import { test, expect } from "@playwright/test";

const { withTemplate } = require("./simple-template");
withTemplate("area", "Y Area");

test.describe("Area Tests", () => {
    simple_tests.easy("area.html", (page) =>
        utils.get_contents(
            page,
            "perspective-viewer perspective-viewer-d3fc-yarea"
        )
    );

    test("Can click a button in the Shadow DOM", async ({ page }, testInfo) => {
        await simple_tests.setupPage(page, testInfo, "area.html");
        let buttonInShadowDom = await page.waitForSelector("#settings_button");
        await buttonInShadowDom.click();
        return true;
        // return await get_contents(page);
    });
});
