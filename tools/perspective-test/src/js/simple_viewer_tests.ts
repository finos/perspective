/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { Page, test } from "@playwright/test";
import { getSvgContentString, compareContentsToSnapshot } from "./utils";
import type { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";

export type ContentExtractor = (page: any) => Promise<string>;

async function restoreTable(page, tableSettings: any) {
    return page.evaluate(async (tableSettings) => {
        const viewer: HTMLPerspectiveViewerElement =
            document.querySelector("perspective-viewer")!;
        await viewer.restore(tableSettings);
    }, tableSettings);
}

function runSimpleCompareTest(
    tableSettings: any,
    extractContent: ContentExtractor,
    snapshotPath: string[]
) {
    test(snapshotPath[1], async ({ page }) => {
        await restoreTable(page, tableSettings);
        const content = await extractContent(page);
        await compareContentsToSnapshot(content, snapshotPath);
    });
}

export async function runRowAndColumnTests(
    context: string,
    extractContent: ContentExtractor
) {
    test("Show grid no settings", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer: HTMLPerspectiveViewerElement =
                document.querySelector("perspective-viewer")!;
            await viewer.getTable(); // Not sure why this is needed...
            await viewer.restore({ settings: true });
        });
        const content = await getSvgContentString("perspective-viewer")(page);
        await compareContentsToSnapshot(content, [
            context,
            `show-grid-no-settings.txt`,
        ]);
    });

    test("Displays visible columns", async ({ page }) => {
        await restoreTable(page, {
            columns: ["Discount", "Profit", "Sales", "Quantity"],
        });

        const visibleColumnContent = await extractContent(page);

        await compareContentsToSnapshot(visibleColumnContent, [
            context,
            `displays-visible-columns.txt`,
        ]);
    });
}

export function runPivotTests(
    context: string,
    extractContent: ContentExtractor
) {
    test.describe("Pivot tests", () => {
        // Pivot by a row
        runSimpleCompareTest(
            {
                group_by: ["State"],
                settings: true,
            },
            extractContent,
            [context, `pivot-by-row.txt`]
        );

        // Pivot by two rows
        runSimpleCompareTest(
            {
                group_by: ["Category", "Sub-Category"],
                settings: true,
            },
            extractContent,
            [context, `pivot-by-two-rows.txt`]
        );

        // Pivot by a column
        runSimpleCompareTest(
            {
                split_by: ["Category"],
                settings: true,
            },
            extractContent,
            [context, `pivot-by-column.txt`]
        );

        // Pivot by a row and a column
        runSimpleCompareTest(
            {
                group_by: ["State"],
                split_by: ["Category"],
                settings: true,
            },
            extractContent,
            [context, `pivot-by-row-and-column.txt`]
        );

        // Pivot by two rows and two columns
        runSimpleCompareTest(
            {
                group_by: ["Region", "State"],
                split_by: ["Category", "Sub-Category"],
                settings: true,
            },
            extractContent,
            [context, `pivot-by-two-rows-and-two-columns.txt`]
        );
    });
}

export function runSortTests(
    context: string,
    extractContent: ContentExtractor
) {
    test.describe("Sort tests", () => {
        // Sort by a hidden column
        runSimpleCompareTest(
            {
                columns: ["Row ID", "Quantity"],
                sort: [["Sales", "asc"]],
                settings: true,
            },
            extractContent,
            [context, `sort-by-hidden-column.txt`]
        );

        // Sort by a numeric column
        runSimpleCompareTest(
            {
                columns: ["Row ID", "Sales"],
                sort: [["Quantity", "asc"]],
                settings: true,
            },
            extractContent,
            [context, `sort-by-numeric-column.txt`]
        );

        // Sort by an alpha column
        runSimpleCompareTest(
            {
                columns: ["Row ID", "State", "Sales"],
                sort: [["State", "asc"]],
                settings: true,
            },
            extractContent,
            [context, `sort-by-alpha-column.txt`]
        );
    });
}

export function runFilterTests(
    context: string,
    extractContent: ContentExtractor
) {
    test.describe("Filter tests", () => {
        // Filter by a numeric column
        runSimpleCompareTest(
            {
                columns: ["Row ID", "State", "Sales"],
                filter: [["Sales", ">", 500]],
                settings: true,
            },
            extractContent,
            [context, `filter-by-numeric-column.txt`]
        );

        // Filter by an alpha column
        runSimpleCompareTest(
            {
                columns: ["Row ID", "State", "Sales"],
                filter: [["State", "==", "Texas"]],
                settings: true,
            },
            extractContent,
            [context, `filter-by-alpha-column.txt`]
        );

        // Filter with 'in' comparator
        runSimpleCompareTest(
            {
                columns: ["Row ID", "State", "Sales"],
                filter: [["State", "in", ["Texas", "California"]]],
                settings: true,
            },
            extractContent,
            [context, `filter-with-in-comparator.txt`]
        );
    });
}

export function run_standard_tests(
    context: string,
    extractContent: ContentExtractor
) {
    runRowAndColumnTests(context, extractContent);
    runPivotTests(context, extractContent);
    runSortTests(context, extractContent);
    runFilterTests(context, extractContent);
}
