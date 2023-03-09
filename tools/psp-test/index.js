/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import path from "path";
import { normalize_xml } from "../perspective-test/src/js/html_compare";

import readFileSync from "fs";

const RESULTS = JSON.parse(readFileSync("aResultsFile"));

exports.get_contents = async function get_contents(page, selector) {
    return await page.evaluate(async (selector) => {
        const shadow = document.querySelector(selector).shadowRoot;
        const svgs = shadow.querySelectorAll("svg");

        let all_viewers = "";
        for (let v of svgs) {
            all_viewers += v.outerHTML;
        }
        return all_viewers;
    }, selector);
};

const setupPage = async function (page, testInfo, asset) {
    await page.goto(path.join(testInfo.project.use.packageURL, asset));
    await page.waitForSelector("perspective-viewer");
    await page.evaluate(async () => {
        await loadTableAsset();
    });
};

exports.setupPage = setupPage;

// async function doTheTest(testName, testFunc) {
//     const contents = await test(testName, testFunc);
//     const results = await compare_tests(contents, testName);
//     // interrogate results here.
// }

async function compare_test(contents, nameOfTest) {
    // Takes 1 contents and a name?
    // hashes the contents, compares with the old hash with same name.
    let { xml: result, hash } = normalize_xml(contents);
}

exports.easy = function (asset, get_contents) {
    // doTheTest("shows a grid without any settings applied", async ({ page }, testInfo) => {});
    test("shows a grid without any settings applied", async ({
        page,
    }, testInfo) => {
        await setupPage(page, testInfo, asset);
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.getTable();
            await viewer.restore({ settings: true });
        });
        let contents = await get_contents(page);

        compare_tests(contents, "shows a grid without any settings applied");
    });
};
