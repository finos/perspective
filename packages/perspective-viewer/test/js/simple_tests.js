/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {drag_drop} = require("@finos/perspective-test");

exports.default = function(method = "capture") {
    test[method]("shows a grid without any settings applied.", async () => {});

    test[method]("pivots by a row.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
    });

    test[method]("pivots by two rows.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("row-pivots", '["Category","Sub-Category"]'), viewer);
    });

    test[method]("pivots by a column.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
    });

    test[method]("pivots by a row and a column.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
        await page.waitForSelector("perspective-viewer:not([updating])");
        await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
    });

    test[method]("pivots by two rows and two columns.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("row-pivots", '["Region","State"]'), viewer);
        await page.waitForSelector("perspective-viewer:not([updating])");
        await page.evaluate(element => element.setAttribute("column-pivots", '["Category","Sub-Category"]'), viewer);
    });

    test[method]("sorts by a hidden column.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.evaluate(element => element.setAttribute("sort", '[["Sales", "asc"]]'), viewer);
    });

    test[method]("sorts by a numeric column.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("sort", '[["Sales", "asc"]]'), viewer);
    });

    test[method]("filters by a numeric column.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("filters", '[["Sales", ">", 500]]'), viewer);
        await page.shadow_blur();
    });

    test[method]("filters by a datetime column.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("filters", '[["Order Date", ">", "01/01/2012"]]'), viewer);
        await page.waitForSelector("perspective-viewer:not([updating])");
        await page.shadow_blur();
    });

    test[method]("highlights invalid filter.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("filters", '[["Sales", "==", null]]'), viewer);
        await page.shadow_blur();
    });

    test[method]("sorts by an alpha column.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("sort", '[["State", "asc"]]'), viewer);
    });

    test[method]("displays visible columns.", async page => {
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await page.evaluate(element => element.setAttribute("columns", '["Discount","Profit","Sales","Quantity"]'), viewer);
    });

    test.skip("pivots by row when drag-and-dropped.", async page => {
        await page.evaluate(async () => await document.querySelector("perspective-viewer").toggleConfig());
        await drag_drop(page, "perspective-row[name=Category]", "#row_pivots");
    });
};
