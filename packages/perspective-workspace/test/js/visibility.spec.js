/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test } from "@playwright/test";
import {
    compareLightDOMContents,
    compareShadowDOMContents,
} from "@finos/perspective-test";

const BAD_LAYOUT = {
    sizes: [1],
    detail: {
        main: {
            type: "tab-area",
            widgets: [
                "PERSPECTIVE_GENERATED_ID_0",
                "PERSPECTIVE_GENERATED_ID_1",
            ],
            currentIndex: 1,
        },
    },
    mode: "globalFilters",
    viewers: {
        PERSPECTIVE_GENERATED_ID_0: {
            plugin: "Sunburst",
            plugin_config: {},
            settings: true,
            theme: null,
            group_by: ["State"],
            split_by: [],
            columns: ["Quantity", null, null],
            filter: [],
            sort: [],
            expressions: [],
            aggregates: {},
            master: false,
            name: "one",
            table: "superstore",
            linked: false,
        },
        PERSPECTIVE_GENERATED_ID_1: {
            plugin: "Sunburst",
            plugin_config: {},
            settings: true,
            theme: null,
            group_by: ["State"],
            split_by: [],
            columns: ["Sales", null, null],
            filter: [],
            sort: [],
            expressions: [],
            aggregates: {},
            master: false,
            name: "two",
            table: "superstore",
            linked: false,
        },
    },
};

function tests(context, compare) {
    test.describe("visibility", () => {
        test("Sunburst charts do not loop forever when disconnected from DOM", async ({
            page,
        }) => {
            await page.evaluate(async (layout) => {
                await window.workspace.restore(layout);
            }, BAD_LAYOUT);

            await page.evaluate(async () => {
                const viewer = document.body.querySelector(
                    'perspective-viewer[name="one"]'
                );
                const workspace = document.getElementById("workspace");
                workspace.removeChild(viewer);
                await workspace.flush();
            });

            return compare(
                page,
                `sunburst-charts-does-not-loop-${context}.txt`
            );
        });
    });
}

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html", {
        waitUntil: "networkidle",
    });
});

test.describe("Workspace Visibility", () => {
    test.describe("Light DOM", () => {
        tests("light-dom", compareLightDOMContents);
    });

    test.describe("Shadow DOM", () => {
        tests("shadow-dom", compareShadowDOMContents);
    });
});
