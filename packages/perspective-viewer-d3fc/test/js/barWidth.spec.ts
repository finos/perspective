/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import { compareSVGContentsToSnapshot } from "@finos/perspective-test";

test.describe("Bar Width", () => {
    test("correctly render when a bar chart has non equidistant times on a datetime axis", async ({
        page,
    }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "Y Bar",
                columns: ["Profit"],
                group_by: ["Order Date"],
                split_by: ["Profit"],
            });
        });

        const config = await page.evaluate(() =>
            document.querySelector("perspective-viewer")!.save()
        );

        expect(config).toEqual({
            plugin: "Y Bar",
            columns: ["Profit"],
            group_by: ["Order Date"],
            split_by: ["Profit"],
            aggregates: {},
            filter: [],
            sort: [],
            plugin_config: {},
            settings: false,
            expressions: [],
            theme: "Pro Light",
            title: null,
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer-d3fc-ybar",
            ["bar-width.txt"]
        );
    });
});
