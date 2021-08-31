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
withTemplate("treemap", "Treemap", {columns: ["Quantity", "Profit"]});

function get_contents(temp) {
    return async function(page) {
        return await page.evaluate(async temp => {
            const viewer = document.querySelector(`perspective-viewer perspective-viewer-d3fc-${temp}`).shadowRoot.querySelector("svg");
            return viewer?.outerHTML || "MISSING";
        }, temp);
    };
}
utils.with_server({}, () => {
    describe.page(
        "treemap.html",
        () => {
            simple_tests.default(get_contents("treemap"));

            // test.capture(
            //     "with column position 1 set to null.",
            //     async page => {
            //         const viewer = await page.$("perspective-viewer");
            //         await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            //         await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
            //         await page.evaluate(element => element.setAttribute("columns", '["Sales", null, "Quantity"]'), viewer);
            //         const columns = JSON.parse(await page.evaluate(element => element.getAttribute("columns"), viewer));
            //         expect(columns).toEqual(["Sales", null, "Quantity"]);
            //     },
            //     {preserve_hover: true}
            // );

            // test.capture(
            //     "tooltip columns works",
            //     async page => {
            //         const viewer = await page.$("perspective-viewer");
            //         await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            //         await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
            //         await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit", "State"]'), viewer);
            //         const columns = JSON.parse(await page.evaluate(element => element.getAttribute("columns"), viewer));
            //         expect(columns).toEqual(["Sales", "Profit", "State"]);
            //         await page.waitForSelector("perspective-viewer:not([updating])");
            //         await page.mouse.move(0, 0);
            //         await page.mouse.move(500, 200);
            //         await page.waitFor(
            //             element => {
            //                 const elem = element.children[0].shadowRoot.querySelector(".tooltip");
            //                 if (elem) {
            //                     return window.getComputedStyle(elem).opacity === "0.9";
            //                 }
            //                 return false;
            //             },
            //             {},
            //             viewer
            //         );
            //     },
            //     {preserve_hover: true}
            // );

            // test.capture(
            //     "treemap label shows formatted date",
            //     async page => {
            //         const viewer = await page.$("perspective-viewer");
            //         await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            //         await page.evaluate(element => element.setAttribute("row-pivots", '["Ship Date"]'), viewer);
            //         await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
            //         await page.waitForSelector("perspective-viewer:not([updating])");
            //     },
            //     {preserve_hover: true}
            // );

            // test.skip("treemap parent button shows formatted date", async page => {
            //     const viewer = await page.$("perspective-viewer");
            //     await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
            //     await page.evaluate(element => element.setAttribute("row-pivots", '["Ship Date", "Ship Mode"]'), viewer);
            //     await page.evaluate(element => element.setAttribute("columns", '["Sales", "Profit"]'), viewer);
            //     await page.waitForSelector("perspective-viewer:not([updating])");

            //     // Click on the chart, wait for the animation to render,
            //     // and then try to get rid of the tooltip by moving the
            //     // mouse again.
            //     await page.mouse.click(500, 200);
            //     await page.waitFor(500);
            //     await page.mouse.move(0, 0);
            //     await page.waitFor(500);
            // });
        },
        {root: path.join(__dirname, "..", "..", "..")}
    );
});
