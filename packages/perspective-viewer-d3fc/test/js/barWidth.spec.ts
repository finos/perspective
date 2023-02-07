/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test, expect } from "@playwright/test";
import {
    setupPage,
    loadTableAsset,
    getViewerConfig,
    compareSVGContentsToSnapshot,
    SUPERSTORE_CSV_PATH,
} from "@finos/perspective-test";

test.describe("Bar Width", () => {
    test("correctly render when a bar chart has non equidistant times on a datetime axis", async ({
        page,
    }) => {
        await setupPage(page, {
            htmlPage: "/tools/perspective-test/src/html/basic-test.html",
            selector: "perspective-viewer",
        });

        await loadTableAsset(page, SUPERSTORE_CSV_PATH, {
            plugin: "Y Bar",
            columns: ["Profit"],
            group_by: ["Order Date"],
            split_by: ["Profit"],
        });

        const config = await getViewerConfig(page);

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
            theme: "Material Light",
            title: null,
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer-d3fc-ybar",
            ["bar-width.txt"]
        );
    });
});
