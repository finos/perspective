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
import {
    compareSVGContentsToSnapshot,
    getSvgContentString,
    run_standard_tests,
} from "@finos/perspective-test";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/basic-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

test.describe("Scatter Tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "X/Y Scatter",
                columns: ["Sales", "Quantity"],
            });
        });
    });

    run_standard_tests(
        "xyscatter",
        getSvgContentString(
            "perspective-viewer perspective-viewer-d3fc-xyscatter"
        )
    );

    test("Scatter charts with a 'label' field render the label", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "X/Y Scatter",
                columns: ["Sales", "Quantity", null, null, null, "State"],
            });
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-xyscatter",
            ["xyscatter-label"]
        );
    });

    test("Scatter charts with a 'label' field render the label when a group by operation is applied", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            await document.querySelector("perspective-viewer")!.restore({
                plugin: "X/Y Scatter",
                group_by: ["State"],
                columns: ["Sales", "Quantity", null, null, null, "City"],
                aggregates: { City: "dominant" },
            });
        });

        await compareSVGContentsToSnapshot(
            page,
            "perspective-viewer perspective-viewer-d3fc-xyscatter",
            ["xyscatter-label-grouped"]
        );
    });
});
