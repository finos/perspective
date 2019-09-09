/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const utils = require("@finos/perspective-test");
const path = require("path");

const {dblclick} = require("./utils.js");

utils.with_server({}, () => {
    describe.page(
        "superstore.html",
        () => {
            describe("editing UI opens", () => {
                test.capture("should not edit an immutable viewer", async page => {
                    await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.waitForSelector("perspective-viewer[settings]");
                    await dblclick(page);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });
            });
        },
        {reload_page: true, root: path.join(__dirname, "..", "..")}
    );

    describe.page(
        "editable.html",
        () => {
            describe("editing UI saves", () => {
                test.capture("should save edits to a string column", async page => {
                    await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.waitForSelector("perspective-viewer[settings]");
                    await dblclick(page);
                    await page.keyboard.sendCharacter("a");
                    await page.keyboard.sendCharacter("b");
                    await page.keyboard.sendCharacter("c");
                    await page.keyboard.sendCharacter("d");
                    await page.keyboard.press("Enter");
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });

                test.capture("should save edits to an integer column", async page => {
                    await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.waitForSelector("perspective-viewer[settings]");
                    await dblclick(page, 50);
                    await page.keyboard.sendCharacter("1");
                    await page.keyboard.sendCharacter("2");
                    await page.keyboard.press("Enter");
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });

                test.capture("should save edits of negative numbers to an integer column", async page => {
                    await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.waitForSelector("perspective-viewer[settings]");
                    await dblclick(page, 50);
                    await page.keyboard.sendCharacter("-");
                    await page.keyboard.sendCharacter("1");
                    await page.keyboard.sendCharacter("2");
                    await page.keyboard.press("Enter");
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });

                test.capture("should fail to save edits of invalid integers", async page => {
                    await page.$("perspective-viewer");
                    await page.shadow_click("perspective-viewer", "#config_button");
                    await page.waitForSelector("perspective-viewer[settings]");
                    await dblclick(page, 50);
                    await page.keyboard.sendCharacter("1");
                    await page.keyboard.sendCharacter("2");
                    await page.keyboard.sendCharacter("A");
                    await page.keyboard.press("Enter");
                    await page.waitFor(100);
                    await page.waitForSelector("perspective-viewer:not([updating])");
                });
            });
        },
        {reload_page: true, root: path.join(__dirname, "..", "..")}
    );
});
