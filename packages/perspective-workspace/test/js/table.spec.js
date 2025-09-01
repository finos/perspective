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
    test("replaceTable() frees the `Table` before resolution", async ({
        page,
    }) => {
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
            await workspace.replaceTable(
                "superstore",
                window.__WORKER__.table("x\n1")
            );
            await window.__TABLE__.delete();
        }, config);

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(page, `${context}-replace-table-frees-table.txt`);
    });

    test("replaceTable() works when previous table errored", async ({
        page,
    }) => {
        const config = {
            viewers: {
                One: { table: "errored", name: "One" },
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"],
                },
            },
        };

        const result = await page.evaluate(async (config) => {
            const workspace = document.getElementById("workspace");
            await workspace.addTable(
                "errored",
                new Promise((_, reject) => setTimeout(reject, 50))
            );

            try {
                await workspace.restore(config);
            } catch (e) {
                console.error(e);
                return e.toString();
            }
        }, config);

        // NOTE This is the error message we expect when `restore()` is called
        // without a `Table`, subject to change.
        expect(result).toEqual(
            "Error: Failed to construct table from JsValue(undefined)"
        );
        await page.evaluate(async () => {
            await workspace.replaceTable(
                "errored",
                window.__WORKER__.table("x\n1")
            );
        });

        await page.evaluate(async () => {
            await workspace.flush();
        });

        return compare(
            page,
            `${context}-replace-table-works-with-errored-table.txt`
        );
    });

    test("removeTable() smoke test", async ({ page }) => {
        const tables = await page.evaluate(async () => {
            const table = await window.__WORKER__.table("x\n1\n");
            const workspace = document.getElementById("workspace");
            await workspace.addTable("temptable", table);
            return Array.from(workspace.tables.keys());
        });
        expect(tables).toEqual(["superstore", "temptable"]);

        const unknownTableResult = await page.evaluate(async () => {
            return await workspace.removeTable("notatable");
        });
        expect(unknownTableResult).toBe(false);

        const result = await page.evaluate(async () => {
            return await workspace.removeTable("temptable");
        });
        expect(result).toBe(true);

        const tablesAfterRemove = await page.evaluate(async () => {
            const workspace = document.getElementById("workspace");
            return Array.from(workspace.tables.keys());
        });
        expect(tablesAfterRemove).toEqual(["superstore"]);
    });
}

test.describe("Workspace table functions", () => {
    test.describe("Light DOM", () => {
        tests("light-dom", compareLightDOMContents);
    });

    test.describe("Shadow DOM", () => {
        tests("shadow-dom", compareShadowDOMContents);
    });
});
