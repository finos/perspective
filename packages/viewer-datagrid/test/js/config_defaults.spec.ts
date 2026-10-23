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

import { expect, test } from "@perspective-dev/test";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/test/src/html/basic-test.html");
    await page.evaluate(async () => {
        while (!(window as any)["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

async function restore(page: Page, config: Record<string, unknown>) {
    await page.evaluate(async (config) => {
        const viewer = document.querySelector("perspective-viewer") as any;
        await viewer.restore(config);
        await viewer.flush();
    }, config);
}

async function setColumnDefaults(
    page: Page,
    defaults: Record<string, unknown> | null,
    options?: Record<string, unknown>,
) {
    await page.evaluate(
        async ({ defaults, options }) => {
            const Viewer = customElements.get("perspective-viewer") as any;
            Viewer.setColumnConfigDefaults(defaults, options);
            await document.querySelector("perspective-viewer")!.flush();
        },
        { defaults, options },
    );
}

async function firstCell(page: Page, name: string): Promise<string> {
    return await page.evaluate((name) => {
        const datagrid = document.querySelector(
            "perspective-viewer-datagrid",
        ) as any;

        const headers = [
            ...datagrid.regular_table.querySelectorAll(
                "thead tr:last-of-type th",
            ),
        ];

        const index = headers.findIndex(
            (th: Element) => th.textContent?.trim() === name,
        );

        const row = datagrid.regular_table.querySelector("tbody tr");
        return row.children[index].textContent.trim();
    }, name);
}

async function savedColumnsConfig(page: Page) {
    return await page.evaluate(async () => {
        const viewer = document.querySelector("perspective-viewer") as any;
        return (await viewer.save()).columns_config;
    });
}

test.describe("Datagrid under config defaults", () => {
    test("a timezone default formats datetime cells", async ({ page }) => {
        await restore(page, {
            plugin: "Datagrid",
            columns: ["Order Date", "Sales"],
        });

        const expected = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer") as any;
            const view = await viewer.getView();
            const cols = await view.to_columns({ start_row: 0, end_row: 1 });
            return new Intl.DateTimeFormat(navigator.languages as string[], {
                dateStyle: "short",
                timeStyle: "medium",
                timeZone: "Pacific/Honolulu",
            }).format(cols["Order Date"][0]);
        });

        const before = await firstCell(page, "Order Date");
        await setColumnDefaults(
            page,
            { date_format: { timeZone: "Pacific/Honolulu" } },
            { type: "datetime" },
        );

        const after = await firstCell(page, "Order Date");
        expect(after).not.toBe(before);
        expect(after).toBe(expected);
        expect(await savedColumnsConfig(page)).toEqual({});
    });

    test("a resize saves only the width", async ({ page }) => {
        await setColumnDefaults(
            page,
            { date_format: { timeZone: "Pacific/Honolulu" } },
            { type: "datetime" },
        );

        await setColumnDefaults(
            page,
            { number_format: { maximumFractionDigits: 4 } },
            { type: "float" },
        );

        await restore(page, {
            plugin: "Datagrid",
            columns: ["Order Date", "Sales"],
        });

        for (const index of [0, 1]) {
            const handle = page
                .locator(
                    "perspective-viewer-datagrid regular-table thead tr:last-of-type th .rt-column-resize",
                )
                .nth(index);

            const pos = await handle.boundingBox();
            await page.mouse.move(pos!.x + 2, pos!.y + 5);
            await page.mouse.down();
            await page.mouse.move(pos!.x + 80, pos!.y + 5);
            await page.mouse.up();
            await expect
                .poll(
                    async () =>
                        Object.keys(await savedColumnsConfig(page)).length,
                )
                .toBe(index + 1);

            await page.waitForTimeout(600);
        }

        await expect
            .poll(async () =>
                Object.keys(await savedColumnsConfig(page)).sort(),
            )
            .toEqual(["Order Date", "Sales"]);

        const saved = await savedColumnsConfig(page);
        expect(Object.keys(saved["Order Date"])).toEqual([
            "column_size_override",
        ]);
        expect(Object.keys(saved["Sales"])).toEqual(["column_size_override"]);
    });
});
