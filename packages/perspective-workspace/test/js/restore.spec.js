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

import { test, expect } from "@finos/perspective-test";
import {
    compareLightDOMContents,
    compareShadowDOMContents,
} from "@finos/perspective-test";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/workspace-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

function tests(context, compare) {
    test("restore workspace with detail only", async ({ page }) => {
        const config = {
            viewers: {
                One: { table: "superstore", name: "One" },
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-detail-only.txt`
        );
    });

    test("restore workspace with master and detail", async ({ page }) => {
        const config = {
            viewers: {
                One: {
                    table: "superstore",
                    name: "Test",
                    group_by: ["State"],
                    columns: ["Sales", "Profit"],
                },
                Two: { table: "superstore", name: "One" },
            },
            master: {
                widgets: ["One"],
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["Two"],
                },
            },
        };

        await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(config);
        }, config);

        await page.evaluate(async () => {
            const workspace = document.getElementById("workspace");
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-restore-workspace-with-master-and-detail.txt`
        );
    });

    test("restore workspace is symmetric with addViewer", async ({ page }) => {
        const initial = await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.addViewer({ table: "superstore" });
            await workspace.flush();
            return await workspace.save();
        });

        const second = await page.evaluate(async (initial) => {
            const workspace = document.getElementById("workspace");
            await workspace.restore(initial);
            await workspace.flush();
            return await workspace.save();
        }, initial);

        expect(initial).toEqual(second);

        return compare(
            page,
            `${context}-restore-workspace-is-symmetric-with-addviewer.txt`
        );
    });
}

test.describe("Workspace restore", () => {
    test.describe("Light DOM", () => {
        tests("light-dom", compareLightDOMContents);
    });

    test.describe("Shadow DOM", () => {
        tests("shadow-dom", compareShadowDOMContents);
    });
});
