/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const add_computed_column = async (page) => {
    await page.click('#config_button');
    await page.$('perspective-viewer');
    await page.click('#add-computed-column');
    await page.$eval('perspective-computed-column', element => {
        element._set_state('input_column', {
            name: 'Order Date',
            type: 'date'
        });
        element._set_state('column_name', 'new_cc');
        element._apply_state();
    });
    await page.select('#psp-cc-computation__select', 'day_of_week');
    await page.click('#psp-cc-button-save');
}

exports.default = function() {

    // basic UI tests
    test.capture("click on add computed column button opens the UI.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
    });

    test.capture("click on close button closes the UI.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
        await page.click('#psp-cc__close');
    });

    // input column
    test.capture("setting a valid column should set it as input.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
        await page.$eval('perspective-computed-column', element => {
            // call internal APIs to bypass drag/drop action
            element._set_state('input_column', {
                name: 'Order Date',
                type: 'date',
            });
            element._set_state('column_name', 'new_cc');
            element._apply_state();
        });
    });

    // computation
    test.capture("computations of the same type should not clear input column.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
        await page.$eval('perspective-computed-column', element => {
            element._set_state('input_column', {
                name: 'Order Date',
                type: 'date',
            });
            element._set_state('column_name', 'new_cc');
            element._apply_state();
        });
        await page.select('#psp-cc-computation__select', 'day_of_week');
    });

    // save
    test.capture("saving a computed column should add it to inactive columns.", async page => {
        await add_computed_column(page);
    });

    test.capture("saving without parameters should show an error message.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
        await page.click('#psp-cc-button-save');
    });

    // edit
    test.skip("clicking on the edit button should bring up the UI", async page => {
        await add_computed_column(page);
        await page.click('#row_edit');
    });

    // usage
    test.capture("aggregates by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('row-pivots', '["Quantity"]'), viewer);
        await page.evaluate(element => element.setAttribute('columns', '["Row ID", "Quantity", "new_cc"]'), viewer);
    });

    test.capture("pivots by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('row-pivots', '["new_cc"]'), viewer);
    });

    test.capture("sorts by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('sort', '["new_cc"]'), viewer);
    });

    test.capture("filters by computed column.", async page => {
        await add_computed_column(page);
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('filters', '[["new_cc", "==", 2]]'), viewer);
    });
};