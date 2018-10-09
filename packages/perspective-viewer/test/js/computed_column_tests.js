/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const add_computed_column = async page => {
    await page.click("#config_button");
    const viewer = await page.$("perspective-viewer");
    await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
    await page.click("#add-computed-column");
    await page.$eval("perspective-computed-column", element => {
        const columns = [{name: "Order Date", type: "datetime"}];
        element._apply_state(columns, element.computations["day_of_week"], "new_cc");
    });
    await page.click("#psp-cc-button-save");
    await page.waitForSelector("perspective-viewer:not([updating])");
    await page.evaluate(element => element.setAttribute("aggregates", '{"new_cc":"dominant"}'), viewer);
    await page.waitForSelector("perspective-viewer:not([updating])");
};

exports.default = function() {
    // basic UI tests
    test.capture("click on add computed column button opens the UI.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.$("perspective-viewer");
        await page.click("#add-computed-column");
    });

    test.capture("click on close button closes the UI.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.$("perspective-viewer");
        await page.click("#add-computed-column");
        await page.click("#psp-cc__close");
    });

    // input column
    test.capture("setting a valid column should set it as input.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.$("perspective-viewer");
        await page.click("#add-computed-column");
        await page.$eval("perspective-computed-column", element => {
            // call internal APIs to bypass drag/drop action
            const columns = [{name: "State", type: "string"}];
            element._apply_state(columns, element.computations["lowercase"], "new_cc");
        });
    });

    test.capture("setting multiple column parameters should set input.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.$("perspective-viewer");
        await page.click("#add-computed-column");
        await page.$eval("perspective-computed-column", element => {
            const columns = [{name: "Quantity", type: "integer"}, {name: "Row ID", type: "integer"}];
            element._apply_state(columns, element.computations["add"], "new_cc");
        });
    });

    // computation
    test.capture("computations should clear input column.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.$("perspective-viewer");
        await page.click("#add-computed-column");
        await page.$eval("perspective-computed-column", element => {
            const columns = [{name: "State", type: "string"}];
            element._apply_state(columns, element.computations["lowercase"], "new_cc");
        });
        await page.select("#psp-cc-computation__select", "subtract");
    });

    // save
    test.capture("saving a computed column should add it to inactive columns.", async page => {
        await add_computed_column(page);
    });

    test.capture("saving without parameters should show an error message.", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("columns", '["Row ID","Quantity"]'), viewer);
        await page.$("perspective-viewer");
        await page.click("#add-computed-column");
        await page.click("#psp-cc-button-save");
    });

    // edit
    test.skip("clicking on the edit button should bring up the UI", async page => {
        await add_computed_column(page);
        await page.click("#row_edit");
    });

    // usage
    test.capture("aggregates by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("row-pivots", '["Quantity"]'), viewer);
        await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "new_cc"]'), viewer);
    });

    test.capture("pivots by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("row-pivots", '["new_cc"]'), viewer);
    });

    test.capture("adds computed column via attribute", async page => {
        await page.click("#config_button");
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("computed-columns", '[{"name":"test","func":"month_bucket","inputs":["Order Date"]}]'), viewer);
        await page.waitForSelector("perspective-viewer:not([updating])");
        await page.evaluate(element => element.setAttribute("columns", '["Quantity", "test"]'), viewer);
        await page.waitForSelector("perspective-viewer:not([updating])");
    });

    test.capture("sorts by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("sort", '["new_cc"]'), viewer);
    });

    test.capture("filters by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("filters", '[["new_cc", "==", "2 Monday"]]'), viewer);
    });

    test.capture("computed column aggregates should persist.", async page => {
        await add_computed_column(page);
        const viewer = await page.$("perspective-viewer");
        await page.evaluate(element => element.setAttribute("row-pivots", '["Quantity"]'), viewer);
        await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "new_cc"]'), viewer);
        await page.evaluate(element => element.setAttribute("aggregates", '{"new_cc":"any"}'), viewer);
        await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity"]'), viewer);
        await page.evaluate(element => element.setAttribute("columns", '["Row ID", "Quantity", "new_cc"]'), viewer);
    });
};
