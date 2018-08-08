/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const utils = require('./utils.js');

const add_computed_column = async (page, name) => {
    await page.click('#config_button');
    const viewer = await page.$('perspective-viewer');
    await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
    await page.$('perspective-viewer');
    await page.click('#add-computed-column');
    await page.$eval('#psp-cc-name', element => element.value = name);
    await utils.drag_drop(page, 'perspective-row[type=date]', '#psp-cc-computation__input-column');
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

    // drag & drop
    test.skip("dragging a valid column should set it as input.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
        await utils.drag_drop(page, 'perspective-row[type=date]', '#psp-cc-computation__input-column');
    });

    test.skip("dragging an invalid column should show an error message.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
        await utils.drag_drop(page, 'perspective-row[type=string]', '#psp-cc-computation__input-column');
    });

    test.skip("selecting a computation should clear the input column.", async page => {
        await page.click('#config_button');
        const viewer = await page.$('perspective-viewer');
        await page.evaluate(element => element.setAttribute('columns', '["Row ID","Quantity"]'), viewer);
        await page.$('perspective-viewer');
        await page.click('#add-computed-column');
        await utils.drag_drop(page, 'perspective-row[type=date]', '#psp-cc-computation__input-column');
        await page.select('#psp-cc-computation__select', 'day_of_week');
    });

    // save
    test.skip("saving a computed column should add it to inactive columns", async page => {
        await add_computed_column(page, 'new_cc');
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
        await add_computed_column(page, 'new_cc');
        await page.click('#row_edit');
    });

};