/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

async function get_contents_default(page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer perspective-viewer-debug");
        return viewer.innerHTML;
    });
}

exports.default = function(get_contents = get_contents_default) {
    test.capture("shows a grid without any settings applied", async page => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.getTable();
            await viewer.restore({settings: true});
        });

        return await get_contents(page);
    });

    test.capture("displays visible columns.", async page => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.restore({columns: ["Discount", "Profit", "Sales", "Quantity"]});
        });

        return await get_contents(page);
    });

    describe("pivot", () => {
        test.capture("by a row", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    row_pivots: ["State"],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("by two rows", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    row_pivots: ["Category", "Sub-Category"],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("by a column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    column_pivots: ["Category"],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("by a row and a column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    row_pivots: ["State"],
                    column_pivots: ["Category"],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("by two rows and two columns", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    row_pivots: ["Region", "State"],
                    column_pivots: ["Category", "Sub-Category"],
                    settings: true
                });
                await viewer.notifyResize();
            });

            return await get_contents(page);
        });
    });

    describe("sort", () => {
        test.capture("by a hidden column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    columns: ["Row ID", "Quantity"],
                    sort: [["Sales", "asc"]],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("by a numeric column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    columns: ["Row ID", "Sales"],
                    sort: [["Sales", "asc"]],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("by an alpha column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    columns: ["Row ID", "State", "Sales"],
                    sort: [["State", "asc"]],
                    settings: true
                });
            });

            return await get_contents(page);
        });
    });

    describe("filters", () => {
        test.capture("filters by a numeric column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    columns: ["Row ID", "State", "Sales"],
                    filter: [["Sales", ">", 500]],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("filters by an alpha column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    columns: ["Row ID", "State", "Sales"],
                    filter: [["State", "==", "Texas"]],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.capture("filters with 'in' comparator", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    columns: ["Row ID", "State", "Sales"],
                    filter: [["State", "in", ["Texas", "California"]]],
                    settings: true
                });
            });

            return await get_contents(page);
        });

        test.skip("filters by a datetime column", async page => {
            await page.evaluate(async () => {
                const viewer = document.querySelector("perspective-viewer");
                await viewer.restore({
                    columns: ["Row ID", "Order Date", "Sales"],
                    filter: [["Order Date", ">", "01/01/2012"]],
                    settings: true
                });
            });

            return await get_contents(page);
        });
    });
};
