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

import { test, expect, PageView } from "../helpers.ts";
import type { Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore-debug.html");
    await page.evaluate(async () => {
        while (!(window as any)["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});

async function openStyleTab(view: PageView, name: string) {
    const col = await view.settingsPanel.activeColumns.getColumnByName(name);
    await view.assureColumnSettingsOpen(col);
    await view.columnSettingsSidebar.container.waitFor({ state: "visible" });
}

function select(view: PageView, label: string): Locator {
    return view.columnSettingsSidebar.container.locator(
        `#${label}-label + div select`,
    );
}

async function dateFormat(view: PageView) {
    const config = (await view.save()) as any;
    return config.columns_config["Order Date"]?.date_format;
}

test.describe("date_format editing", () => {
    test("a display field edit stores the whole shape", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Format",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        await expect(select(view, "time-style")).toHaveValue("disabled");
        await select(view, "time-style").selectOption("short");
        expect(await dateFormat(view)).toEqual({
            dateStyle: "medium",
            timeStyle: "short",
        });
    });

    test("a timezone edit stores only the timezone", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        await select(view, "timezone").selectOption("Asia/Tokyo");
        expect(await dateFormat(view)).toEqual({ timeZone: "Asia/Tokyo" });
    });

    test("hiding a field stores the shape without it", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        await select(view, "time-style").selectOption("disabled");
        expect(await dateFormat(view)).toEqual({ dateStyle: "short" });
    });

    test("returning to the inherited shape stores nothing", async ({
        page,
    }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        await select(view, "date-style").selectOption("long");
        await select(view, "date-style").selectOption("short");
        expect(((await view.save()) as any).columns_config).toEqual({});
    });

    test("the last shown display field cannot be hidden", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Format",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        const hidden = 'option[value="disabled"]';
        await expect(select(view, "date-style").locator(hidden)).toHaveCount(0);
        await select(view, "time-style").selectOption("short");
        await expect(select(view, "date-style").locator(hidden)).toHaveCount(1);
        await expect(select(view, "time-style").locator(hidden)).toHaveCount(1);
    });

    test("switching modes writes the other mode's shape", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        const toggle =
            view.columnSettingsSidebar.container.locator("#datetime_format");

        await toggle.click();
        expect(await dateFormat(view)).toEqual({
            year: "2-digit",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        });

        await toggle.click();
        expect(((await view.save()) as any).columns_config).toEqual({});
    });

    test("successive per-part edits accumulate", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        await view.columnSettingsSidebar.container
            .locator("#datetime_format")
            .click();

        await select(view, "year").selectOption("numeric");
        await select(view, "month").selectOption("long");
        await select(view, "second").selectOption("disabled");
        expect(await dateFormat(view)).toEqual({
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });

        await expect(select(view, "year")).toHaveValue("numeric");
    });

    test("successive preset edits accumulate", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        await select(view, "date-style").selectOption("long");
        await select(view, "time-style").selectOption("short");
        expect(await dateFormat(view)).toEqual({
            dateStyle: "long",
            timeStyle: "short",
        });
    });

    test("restore rejects a value mixing presets and parts", async ({
        page,
    }) => {
        const view = new PageView(page);
        await view.restore({ plugin: "Debug Styled", columns: ["Order Date"] });
        const error = await page.evaluate(async () => {
            try {
                await document.querySelector("perspective-viewer")!.restore({
                    columns_config: {
                        "Order Date": {
                            date_format: { dateStyle: "long", year: "numeric" },
                        },
                    },
                } as any);
                return null;
            } catch (e: any) {
                return e.message ?? String(e);
            }
        });

        expect(error).toMatch(/Order Date.*date_format.*cannot be combined/);
    });

    test("restore rejects an unknown date_format key", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({ plugin: "Debug Styled", columns: ["Order Date"] });
        const error = await page.evaluate(async () => {
            try {
                await document.querySelector("perspective-viewer")!.restore({
                    columns_config: {
                        "Order Date": { date_format: { date_style: "long" } },
                    },
                } as any);
                return null;
            } catch (e: any) {
                return e.message ?? String(e);
            }
        });

        expect(error).toMatch(/unknown field `date_style`/);
    });

    test("a restored value equal to the inherited one is stripped", async ({
        page,
    }) => {
        const view = new PageView(page);
        await view.restore({
            plugin: "Debug Format",
            columns: ["Order Date"],
            columns_config: {
                "Order Date": { date_format: { dateStyle: "medium" } },
            },
        });

        expect(((await view.save()) as any).columns_config).toEqual({});
    });
});
