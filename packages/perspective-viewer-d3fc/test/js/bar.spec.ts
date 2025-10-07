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

import { test } from "@finos/perspective-test";
import {
    run_standard_tests,
    getSvgContentString,
} from "@finos/perspective-test";

test.describe("Bar Tests", () => {
    test.describe("Y Bar", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(
                "/node_modules/@finos/perspective-test/src/html/basic-test.html",
            );
            await page.evaluate(async () => {
                while (!window["__TEST_PERSPECTIVE_READY__"]) {
                    await new Promise((x) => setTimeout(x, 10));
                }
            });

            await page.evaluate(async () => {
                await document.querySelector("perspective-viewer")!.restore({
                    plugin: "Y Bar",
                    columns: ["Sales"],
                });
            });
        });

        run_standard_tests(
            "y-bar",
            getSvgContentString(
                "perspective-viewer perspective-viewer-d3fc-ybar",
            ),
        );
    });

    test.describe("X Bar", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(
                "/node_modules/@finos/perspective-test/src/html/basic-test.html",
            );
            await page.evaluate(async () => {
                while (!window["__TEST_PERSPECTIVE_READY__"]) {
                    await new Promise((x) => setTimeout(x, 10));
                }
            });

            await page.evaluate(async () => {
                await document.querySelector("perspective-viewer")!.restore({
                    plugin: "X Bar",
                    columns: ["Sales"],
                });
            });
        });
        run_standard_tests(
            "x-bar",
            getSvgContentString(
                "perspective-viewer perspective-viewer-d3fc-xbar",
            ),
        );
    });

    test.describe("Y Bar (Themed)", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(
                "/node_modules/@finos/perspective-test/src/html/themed-test.html",
            );
            await page.evaluate(async () => {
                while (!window["__TEST_PERSPECTIVE_READY__"]) {
                    await new Promise((x) => setTimeout(x, 10));
                }
            });

            await page.evaluate(async () => {
                await document.querySelector("perspective-viewer")!.restore({
                    plugin: "Y Bar",
                    columns: ["Sales"],
                });
            });
        });

        run_standard_tests(
            "y-bar-themed",
            getSvgContentString(
                "perspective-viewer perspective-viewer-d3fc-ybar",
            ),
        );
    });
});
