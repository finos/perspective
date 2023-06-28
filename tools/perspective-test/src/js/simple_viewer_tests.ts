// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { test } from "@playwright/test";
import { getSvgContentString, compareContentsToSnapshot } from "./utils";
import type { PerspectiveViewerConfig } from "@finos/perspective-viewer";

export type ContentExtractor = (page: any) => Promise<string>;

async function restoreViewer(page, viewerConfig: PerspectiveViewerConfig) {
    return await page.evaluate(async (viewerConfig) => {
        const viewer = document.querySelector("perspective-viewer")!;
        await viewer.restore(viewerConfig);
    }, viewerConfig);
}

function runSimpleCompareTest(
    viewerConfig: PerspectiveViewerConfig,
    extractContent: ContentExtractor,
    snapshotPath: string[]
) {
    return async ({ page }) => {
        await restoreViewer(page, viewerConfig);
        const content = await extractContent(page);
        await compareContentsToSnapshot(content, snapshotPath);
    };
}

export function run_standard_tests(
    context: string,
    extractContent: ContentExtractor
) {
    test("Show grid no settings", async ({ page }) => {
        await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer")!;
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
        await restoreViewer(page, {
            columns: ["Discount", "Profit", "Sales", "Quantity"],
        });

        const visibleColumnContent = await extractContent(page);
        await compareContentsToSnapshot(visibleColumnContent, [
            context,
            `displays-visible-columns.txt`,
        ]);
    });

    test.describe("Pivot tests", () => {
        test(
            `Pivot by a row`,
            runSimpleCompareTest(
                {
                    group_by: ["State"],
                    settings: true,
                },
                extractContent,
                [context, `pivot-by-row.txt`]
            )
        );

        test(
            `Pivot by two rows`,
            runSimpleCompareTest(
                {
                    group_by: ["Category", "Sub-Category"],
                    settings: true,
                },
                extractContent,
                [context, `pivot-by-two-rows.txt`]
            )
        );

        test(
            `Pivot by a column`,
            runSimpleCompareTest(
                {
                    split_by: ["Category"],
                    settings: true,
                },
                extractContent,
                [context, `pivot-by-column.txt`]
            )
        );

        test(
            `Pivot by a row and a column`,
            runSimpleCompareTest(
                {
                    group_by: ["State"],
                    split_by: ["Category"],
                    settings: true,
                },
                extractContent,
                [context, `pivot-by-row-and-column.txt`]
            )
        );

        test(
            `Pivot by two rows and two columns`,
            runSimpleCompareTest(
                {
                    group_by: ["Region", "State"],
                    split_by: ["Category", "Sub-Category"],
                    settings: true,
                },
                extractContent,
                [context, `pivot-by-two-rows-and-two-columns.txt`]
            )
        );
    });

    test.describe("Sort tests", () => {
        test(
            `Sort by a hidden column`,
            runSimpleCompareTest(
                {
                    columns: ["Row ID", "Quantity"],
                    sort: [["Sales", "asc"]],
                    settings: true,
                },
                extractContent,
                [context, `sort-by-hidden-column.txt`]
            )
        );

        test(
            `Sort by a numeric column`,
            runSimpleCompareTest(
                {
                    columns: ["Row ID", "Sales"],
                    sort: [["Quantity", "asc"]],
                    settings: true,
                },
                extractContent,
                [context, `sort-by-numeric-column.txt`]
            )
        );

        test(
            `Sort by an alpha column`,
            runSimpleCompareTest(
                {
                    columns: ["Row ID", "State", "Sales"],
                    sort: [["State", "asc"]],
                    settings: true,
                },
                extractContent,
                [context, `sort-by-alpha-column.txt`]
            )
        );
    });

    test.describe("Filter tests", () => {
        test(
            `Filter by a numeric column`,
            runSimpleCompareTest(
                {
                    columns: ["Row ID", "State", "Sales"],
                    filter: [["Sales", ">", 500]],
                    settings: true,
                },
                extractContent,
                [context, `filter-by-numeric-column.txt`]
            )
        );

        test(
            `Filter by an alpha column`,
            runSimpleCompareTest(
                {
                    columns: ["Row ID", "State", "Sales"],
                    filter: [["State", "==", "Texas"]],
                    settings: true,
                },
                extractContent,
                [context, `filter-by-alpha-column.txt`]
            )
        );

        test(
            `Filter with 'in' comparator`,
            runSimpleCompareTest(
                {
                    columns: ["Row ID", "State", "Sales"],
                    filter: [["State", "in", ["Texas", "California"]]],
                    settings: true,
                },
                extractContent,
                [context, `filter-with-in-comparator.txt`]
            )
        );
    });
}
