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
import type { Locator, Page } from "@playwright/test";

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

async function column(view: PageView, name: string): Promise<Locator> {
    const col = await view.settingsPanel.activeColumns.getColumnByName(name);
    return col.container;
}

function field(view: PageView, label: string): Locator {
    return view.columnSettingsSidebar.container.locator(
        `#${label}-label + div`,
    );
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

test.describe("Style tab under config defaults", () => {
    test("shows an overridden default and stores nothing for it", async ({
        page,
    }) => {
        await setColumnDefaults(
            page,
            { mode: "bar" },
            { plugin: "Debug Defaults" },
        );
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Defaults",
            columns: ["Sales"],
        });

        await openStyleTab(view, "Sales");
        const mode = field(view, "mode").locator("select");
        await expect(mode).toHaveValue("bar");
        await expect(await column(view, "Sales")).not.toHaveClass(
            /is-modified/,
        );

        await mode.selectOption("none");
        expect(((await view.save()) as any).columns_config).toEqual({
            Sales: { mode: "none" },
        });

        await expect(await column(view, "Sales")).toHaveClass(/is-modified/);

        await mode.selectOption("bar");
        expect(((await view.save()) as any).columns_config).toEqual({});
        await expect(await column(view, "Sales")).not.toHaveClass(
            /is-modified/,
        );
    });

    test("updates when a default is set while open", async ({ page }) => {
        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Defaults",
            columns: ["Sales"],
        });

        await openStyleTab(view, "Sales");
        const mode = field(view, "mode").locator("select");
        await expect(mode).toHaveValue("none");
        await setColumnDefaults(page, { mode: "bar" });
        await expect(mode).toHaveValue("bar");
    });

    test("the timezone select shows a timezone default", async ({ page }) => {
        await setColumnDefaults(
            page,
            { date_format: { timeZone: "Asia/Tokyo" } },
            { type: "datetime" },
        );

        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Order Date"],
        });

        await openStyleTab(view, "Order Date");
        await expect(field(view, "timezone").locator("select")).toHaveValue(
            "Asia/Tokyo",
        );

        expect(((await view.save()) as any).columns_config).toEqual({});
    });

    test("a one-bound number default shows both bounds", async ({ page }) => {
        await setColumnDefaults(
            page,
            { number_format: { maximumFractionDigits: 4 } },
            { type: "float" },
        );

        const view = new PageView(page);
        await view.restore({
            settings: true,
            plugin: "Debug Styled",
            columns: ["Sales"],
        });

        await openStyleTab(view, "Sales");
        const frac = field(view, "fractional-digits");
        await expect(frac.locator("input.parameter-min")).toHaveValue("2");
        await expect(frac.locator("input.parameter-max")).toHaveValue("4");
        expect(((await view.save()) as any).columns_config).toEqual({});
    });
});

test.describe("Plugin tab under config defaults", () => {
    test("shows an overridden default", async ({ page }) => {
        await page.evaluate(() => {
            const Viewer = customElements.get("perspective-viewer") as any;
            Viewer.setPluginConfigDefaults({ edit_mode: "EDIT" });
        });

        const view = new PageView(page);
        await view.restore({ settings: true, plugin: "Debug Defaults" });
        await view.container.locator("#plugin_tabbar_tab").click();
        const tab = view.container.locator("#plugin-tab");
        await tab.waitFor({ state: "visible" });
        await expect(tab.locator("#edit_mode-label + div select")).toHaveValue(
            "EDIT",
        );

        await page.evaluate(async () => {
            const Viewer = customElements.get("perspective-viewer") as any;
            Viewer.setPluginConfigDefaults({ edit_mode: null });
            await document.querySelector("perspective-viewer")!.flush();
        });

        await expect(tab.locator("#edit_mode-label + div select")).toHaveValue(
            "READ_ONLY",
        );
    });
});
