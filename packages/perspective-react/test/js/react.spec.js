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

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/dist/react-test/index.html");
    await page.locator("perspective-viewer-datagrid").waitFor();
});

test.describe("Perspective React", () => {
    test("The viewer loads with data in it", async ({ page }) => {
        const data = await page
            .locator("perspective-viewer")
            .evaluate(async (viewer) => {
                const view = await viewer.getView();
                return view.to_columns();
            });

        expect(data).toEqual({
            x: [1, 2, 3],
        });
    });

    test("Changing tables updates the viewer", async ({ page }) => {
        await expect(page.locator("perspective-viewer-datagrid")).toBeVisible();
        await page.evaluate(() => {
            console.log("TEST_HARNESS", window.__PSP_REACT_TEST_HARNESS__);
            window.__PSP_REACT_TEST_HARNESS__.setSelectedTable(undefined);
        });
        await expect(
            page.locator("perspective-viewer-datagrid")
        ).not.toBeVisible();

        await page.evaluate(async () => {
            const harness = window.__PSP_REACT_TEST_HARNESS__;
            console.log("SYS_INFO", await harness.worker.system_info());
            const t = harness.worker.table({ y: [4, 5, 6] });
            harness.actions.addTable({
                table: "test_my_new_table",
                promise: t,
            });
            harness.setSelectedTable("test_my_new_table");
        });

        await expect(page.locator("perspective-viewer-datagrid")).toBeVisible();

        const data = await page
            .locator("perspective-viewer")
            .evaluate(async (viewer) => {
                const view = await viewer.getView();
                return view.to_columns();
            });

        expect(data).toEqual({
            y: [4, 5, 6],
        });
    });

    test(
        "Doesn't leak WASM heap",
        async ({ page }) => {
            await page.evaluate(async () => {
                const harness = window.__PSP_REACT_TEST_HARNESS__;
                const numbers = Array.from({ length: 1000000 }, (_, i) => i);
                window.table = harness.worker.table({ y: numbers });
                harness.actions.addTable({
                    table: "test_my_new_table",
                    promise: window.table,
                });
                harness.setSelectedTable("test_my_new_table");
            });
            await page.locator("perspective-viewer-datagrid").waitFor();

            const createDeleteViewer = async () => {
                await page.evaluate(async () => {
                    const harness = window.__PSP_REACT_TEST_HARNESS__;
                    harness.actions.addTable({
                        table: "test_my_new_table",
                        promise: window.table,
                    });
                    harness.setSelectedTable("test_my_new_table");
                });
                await page.locator("perspective-viewer-datagrid").waitFor();
            };

            const getHeapSize = async () =>
                await page.evaluate(async () => {
                    const harness = window.__PSP_REACT_TEST_HARNESS__;
                    return (await harness.worker.system_info()).heap_size;
                });

            for (let i = 0; i < 2; i++) {
                await createDeleteViewer();
            }

            const startHeapSize = await getHeapSize();
            for (let i = 0; i < 10; i++) {
                await createDeleteViewer();
            }
            const endHeapSize = await getHeapSize();

            expect(endHeapSize - startHeapSize).toBeLessThan(100);
        },
        { timeout: 600000 }
    );
});
