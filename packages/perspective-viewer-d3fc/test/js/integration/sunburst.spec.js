/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");

const utils = require("@finos/perspective-test");
const simple_tests = require("@finos/perspective-viewer/test/js/simple_tests.js");

const {withTemplate} = require("./simple-template");
withTemplate("sunburst", "Sunburst");

function get_contents(temp) {
    return async function (page) {
        return await page.evaluate(async (temp) => {
            const viewer = document
                .querySelector(
                    `perspective-viewer perspective-viewer-d3fc-${temp}`
                )
                .shadowRoot.querySelector("svg");
            viewer?.removeAttribute("viewBox");
            return viewer?.outerHTML || "MISSING";
        }, temp);
    };
}
utils.with_server({}, () => {
    describe.page(
        "sunburst.html",
        () => {
            simple_tests.default(get_contents("sunburst"));

            // test.skip("sunburst label shows formatted date", async page => {
            //     const viewer = await page.$("perspective-viewer");
            //     await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            //     await page.evaluate(element => element.setAttribute("row-pivots", '["Ship Date"]'), viewer);
            //     await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
            //     await page.evaluate(element => element.setAttribute("filters", '[["Product ID", "==", "FUR-BO-10001798"]]'), viewer);
            //     await page.waitForSelector("perspective-viewer:not([updating])");
            //     await page.shadow_blur();
            //     const result = await page.waitFor(
            //         element => {
            //             let elem = element.children[0].shadowRoot.querySelector(".segment");
            //             if (elem) {
            //                 // TODO Full label is clipped
            //                 return elem.textContent.includes("11/");
            //             }
            //         },
            //         {},
            //         viewer
            //     );
            //     return !!result;
            // });

            // test.skip("sunburst parent button shows formatted date", async page => {
            //     const viewer = await page.$("perspective-viewer");
            //     await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            //     await page.evaluate(element => element.setAttribute("row-pivots", '["Ship Date", "City"]'), viewer);
            //     await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
            //     await page.evaluate(element => element.setAttribute("filters", '[["Product ID", "==", "FUR-BO-10001798"]]'), viewer);
            //     await page.waitForSelector("perspective-viewer:not([updating])");
            //     await page.shadow_blur();
            //     await page.mouse.click(500, 400);
            //     const result = await page.waitFor(
            //         element => {
            //             let elem = element.children[0].shadowRoot.querySelector(".parent");
            //             if (elem) {
            //                 return elem.textContent.includes("11/12/2013, 12:00:00 AM");
            //             }
            //         },
            //         {},
            //         viewer
            //     );
            //     return !!result;
            // });
        },
        {root: path.join(__dirname, "..", "..", "..")}
    );
});
