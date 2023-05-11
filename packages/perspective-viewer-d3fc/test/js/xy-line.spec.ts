/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { test } from "@playwright/test";
import {
    getSvgContentString,
    run_standard_tests,
} from "@finos/perspective-test";

test.describe("X/Y Line Tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });

        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "X/Y Line",
                columns: ["Sales", "Quantity"],
            });
        });
    });

    run_standard_tests(
        "xyline",
        getSvgContentString("perspective-viewer perspective-viewer-d3fc-xyline")
    );
});
