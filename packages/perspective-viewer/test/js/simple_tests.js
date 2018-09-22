/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {drag_drop} = require("./utils");

exports.default = function() {
    test.capture("shows a grid without any settings applied.", async () => {});

    test.capture("pivots by a row.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
    });

    test.capture("pivots by two rows.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("row-pivots", '["Category","Sub-Category"]'), viewer);
    });

    test.capture("pivots by a column.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
    });

    test.capture("pivots by a row and a column.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("row-pivots", '["State"]'), viewer);
        await page.waitForSelector("perspective-viewer:not([updating])");
        await page.evaluate(element => element.setAttribute("column-pivots", '["Category"]'), viewer);
    });

    test.capture("pivots by two rows and two columns.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("row-pivots", '["Region","State"]'), viewer);
        await page.waitForSelector("perspective-viewer:not([updating])");
        await page.evaluate(element => element.setAttribute("column-pivots", '["Category","Sub-Category"]'), viewer);
    });

    test.capture("sorts by a hidden column.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.evaluate(element => element.setAttribute("sort", '["Sales"]'), viewer);
    });

    test.capture("sorts by a numeric column.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("sort", '["Sales"]'), viewer);
    });

    test.capture("filters by a numeric column.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("filters", '[["Sales", ">", 500]]'), viewer);
    });

    test.capture("sorts by an alpha column.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("sort", '["State"]'), viewer);
    });

    test.capture("displays visible columns.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Discount","Profit","Sales","Quantity"]'), viewer);
    });

    test.skip("pivots by row when drag-and-dropped.", async page => {
        await page.click("#config_button");
        await drag_drop(page, "perspective-row[name=Category]", "#row_pivots");
    });
};
