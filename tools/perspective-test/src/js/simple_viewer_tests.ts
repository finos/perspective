/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { Page } from "@playwright/test";
import { getSvgContentString, compareContentsToSnapshot } from "./utils";

export type ContentExtractor = (page: any) => Promise<string>;

async function restoreTable(page, tableSettings: any) {
    return page.evaluate(async (tableSettings) => {
        const viewer = document.querySelector("perspective-viewer");
        // @ts-ignore
        await viewer.restore(tableSettings);
    }, tableSettings);
}

async function runSimpleCompareTest(
    page,
    tableSettings: any,
    extractContent: ContentExtractor,
    snapshotPath: string[]
) {
    await restoreTable(page, tableSettings);
    const content = await extractContent(page);

    await compareContentsToSnapshot(content, snapshotPath);
}

export async function runRowAndColumnTests(
    page,
    context: string,
    extractContent: ContentExtractor
) {
    // Show a grid without any settings applied.
    // FYI/NOTE: this currently doesn't have any svgs, so is empty when using with d3fc tests.
    await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer");
        // @ts-ignore
        await viewer.getTable(); // Not sure why this is needed...
        // @ts-ignore
        await viewer.restore({ settings: true });
    });
    const content = await getSvgContentString("perspective-viewer")(page);
    await compareContentsToSnapshot(content, [
        context,
        `show-grid-no-settings.txt`,
    ]);

    // Displays visible columns.
    await restoreTable(page, {
        columns: ["Discount", "Profit", "Sales", "Quantity"],
    });

    const visibleColumnContent = await extractContent(page);

    await compareContentsToSnapshot(visibleColumnContent, [
        context,
        `displays-visible-columns.txt`,
    ]);
}

export async function runPivotTests(
    page,
    context: string,
    extractContent: ContentExtractor
) {
    // Pivot by a row
    await runSimpleCompareTest(
        page,
        {
            group_by: ["State"],
            settings: true,
        },
        extractContent,
        [context, `pivot-by-row.txt`]
    );

    // Pivot by two rows
    await runSimpleCompareTest(
        page,
        {
            group_by: ["Category", "Sub-Category"],
            settings: true,
        },
        extractContent,
        [context, `pivot-by-two-rows.txt`]
    );

    // Pivot by a column
    await runSimpleCompareTest(
        page,
        {
            split_by: ["Category"],
            settings: true,
        },
        extractContent,
        [context, `pivot-by-column.txt`]
    );

    // Pivot by a row and a column
    await runSimpleCompareTest(
        page,
        {
            group_by: ["State"],
            split_by: ["Category"],
            settings: true,
        },
        extractContent,
        [context, `pivot-by-row-and-column.txt`]
    );

    // Pivot by two rows and two columns
    await runSimpleCompareTest(
        page,
        {
            group_by: ["Region", "State"],
            split_by: ["Category", "Sub-Category"],
            settings: true,
        },
        extractContent,
        [context, `pivot-by-two-rows-and-two-columns.txt`]
    );
}

export async function runSortTests(
    page,
    context: string,
    extractContent: ContentExtractor
) {
    // Sort by a hidden column
    await runSimpleCompareTest(
        page,
        {
            columns: ["Row ID", "Quantity"],
            sort: [["Sales", "asc"]],
            settings: true,
        },
        extractContent,
        [context, `sort-by-hidden-column.txt`]
    );

    // Sort by a numeric column
    await runSimpleCompareTest(
        page,
        {
            columns: ["Row ID", "Sales"],
            sort: [["Quantity", "asc"]],
            settings: true,
        },
        extractContent,
        [context, `sort-by-numeric-column.txt`]
    );

    // Sort by an alpha column
    await runSimpleCompareTest(
        page,
        {
            columns: ["Row ID", "State", "Sales"],
            sort: [["State", "asc"]],
            settings: true,
        },
        extractContent,
        [context, `sort-by-alpha-column.txt`]
    );
}

export async function runFilterTests(
    page,
    context: string,
    extractContent: ContentExtractor
) {
    // Filter by a numeric column
    await runSimpleCompareTest(
        page,
        {
            columns: ["Row ID", "State", "Sales"],
            filter: [["Sales", ">", 500]],
            settings: true,
        },
        extractContent,
        [context, `filter-by-numeric-column.txt`]
    );

    // Filter by an alpha column
    await runSimpleCompareTest(
        page,
        {
            columns: ["Row ID", "State", "Sales"],
            filter: [["State", "==", "Texas"]],
            settings: true,
        },
        extractContent,
        [context, `filter-by-alpha-column.txt`]
    );

    // Filter with 'in' comparator
    await runSimpleCompareTest(
        page,
        {
            columns: ["Row ID", "State", "Sales"],
            filter: [["State", "in", ["Texas", "California"]]],
            settings: true,
        },
        extractContent,
        [context, `filter-with-in-comparator.txt`]
    );
}

// NOTE: Make sure that the right test data (superstore.csv?) is loaded before running these tests.
export async function runAllStandardTests(
    page: Page,
    context: string,
    extractContent: ContentExtractor
) {
    await runRowAndColumnTests(page, context, extractContent);
    await runPivotTests(page, context, extractContent);
    await runSortTests(page, context, extractContent);
    await runFilterTests(page, context, extractContent);
}
