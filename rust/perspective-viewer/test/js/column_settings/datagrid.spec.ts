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

import {
    PageView as PspViewer,
    compareNodes,
    getEventListener,
} from "@finos/perspective-test";

import { expect, test } from "@finos/perspective-test";

test.describe("Regressions", function () {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });
    });

    test("Interacting with column settings does not override column width", async function ({
        page,
    }) {
        const view = new PspViewer(page);
        await view.openSettingsPanel();
        const resize_handle = view.dataGrid.regularTable.columnTitleRow
            .locator("th .rt-column-resize")
            .first();

        const pos = await resize_handle.boundingBox();
        await page.mouse.move(pos!.x + 2, pos!.y + 5);
        await page.mouse.down();
        await page.mouse.move(pos!.x + 100, pos!.y + 5);
        await page.mouse.up();

        const editBtn = view.dataGrid.regularTable.editBtnRow
            .locator("th.psp-menu-enabled span")
            .first();

        await editBtn.click();
        await view.columnSettingsSidebar.container.waitFor();
        await view.columnSettingsSidebar.styleTab.precision_input.fill("4");
        const token = await view.save();
        test.expect(token.plugin_config.columns).toEqual({
            "Row ID": {
                column_size_override: 150,
                fixed: 4,
            },
        });
    });
});

let runTests = (title: string, beforeEachAndLocalTests: () => void) => {
    return test.describe(title, () => {
        beforeEachAndLocalTests.call(this);

        test("Clicking edit button toggles sidebar", async ({ page }) => {
            let view = new PspViewer(page);
            await view.openSettingsPanel();
            let editBtn = view.dataGrid.regularTable.editBtnRow
                .locator("th.psp-menu-enabled span")
                .first();
            await editBtn.click();
            await view.columnSettingsSidebar.container.waitFor();
            await editBtn.click();
            await view.columnSettingsSidebar.container.waitFor({
                state: "hidden",
            });
        });

        test("Toggling a column in the sidebar highlights in the plugin", async ({
            page,
        }) => {
            let view = new PspViewer(page);
            let table = view.dataGrid.regularTable;
            let activeColumns = view.settingsPanel.activeColumns;

            await view.openSettingsPanel();
            let col = await activeColumns.getFirstVisibleColumn();
            let name = await col.name.innerText();
            expect(name).toBeDefined();

            let n = await table.getTitleIdx(name);
            expect(n).toBeGreaterThan(-1);

            let nthEditBtn = table.realEditBtns.nth(n);
            let selectedEditBtn = table.editBtnRow
                .locator(".psp-menu-open")
                .first();

            await col.editBtn.click();
            await selectedEditBtn.waitFor();

            expect(await compareNodes(nthEditBtn, selectedEditBtn, page)).toBe(
                true
            );

            await col.editBtn.click();
            await selectedEditBtn.waitFor({ state: "hidden" });
        });

        test("Scrolling the table horizontally keeps the correct column highlighted", async ({
            page,
        }) => {
            let view = new PspViewer(page);
            let table = view.dataGrid.regularTable;

            let thirdTitle = table.columnTitleRow.locator("th").nth(3);
            let thirdEditBtn = table.editBtnRow.locator("th").nth(3);
            let selectedTitle = table.columnTitleRow
                .locator(".psp-menu-open")
                .first();
            let selectedEditBtn = table.editBtnRow
                .locator(".psp-menu-open")
                .first();

            await view.openSettingsPanel();
            await table.element.evaluate((node) => (node.scrollLeft = 0));
            await thirdEditBtn.click();
            await selectedEditBtn.waitFor();
            await selectedTitle.waitFor();
            expect(
                await compareNodes(thirdEditBtn, selectedEditBtn, page)
            ).toBe(true);
            expect(await compareNodes(thirdTitle, selectedTitle, page)).toBe(
                true
            );

            await table.element.evaluate((node) => (node.scrollLeft = 1000));
            await table.element.evaluate((node) => (node.scrollLeft = 0));
            await selectedEditBtn.waitFor();
            await selectedTitle.waitFor();
            expect(
                await compareNodes(thirdEditBtn, selectedEditBtn, page)
            ).toBe(true);
            expect(await compareNodes(thirdTitle, selectedTitle, page)).toBe(
                true
            );
        });

        // These tests only check that a connection is made between the column settings sidebar
        // and the plugin itself. They do not need to check the exact contents of the plugin.
        test("Numeric styling", async ({ page }) => {
            let view = new PspViewer(page);
            let table = view.dataGrid.regularTable;

            let col = await view.getOrCreateColumnByType("numeric");
            await col.editBtn.click();
            let name = await col.name.innerText();
            expect(name).toBeTruthy();
            let td = await table.getFirstCellByColumnName(name);
            await td.waitFor();

            // bg style
            await view.columnSettingsSidebar.openTab("style");
            let contents = view.columnSettingsSidebar.styleTab.contents;
            let checkbox = contents.locator("input[type=checkbox]").last();
            await checkbox.waitFor();

            let tdStyle = await td.evaluate((node) => node.style.cssText);
            let listener = await getEventListener(
                page,
                "perspective-column-style-change"
            );
            await checkbox.click();
            expect(await listener()).toBe(true);
            let newStyle = await td.evaluate((node) => node.style.cssText);
            expect(tdStyle).not.toBe(newStyle);
        });

        test("Calendar styling", async ({ page }) => {
            let view = new PspViewer(page);
            let table = view.dataGrid.regularTable;

            let col = await view.getOrCreateColumnByType("calendar");
            let name = await col.name.innerText();
            expect(name).toBeTruthy();
            let td = await table.getFirstCellByColumnName(name);
            await td.waitFor();

            // text style
            view.assureColumnSettingsOpen(col);
            await view.columnSettingsSidebar.openTab("style");
            let contents = view.columnSettingsSidebar.styleTab.contents;
            let checkbox = contents
                .locator("input[type=checkbox]:not(:disabled)")
                .first();
            let tdStyle = await td.evaluate((node) => {
                return node.style.cssText;
            });
            let listener = await getEventListener(
                page,
                "perspective-column-style-change"
            );
            await checkbox.click();
            expect(await listener()).toBe(true);
            let newStyle = await td.evaluate((node) => {
                return node.style.cssText;
            });
            expect(tdStyle).not.toBe(newStyle);
        });

        test.skip("Boolean styling", async ({ page }) => {
            // Boolean styling is not implemented.
        });

        test("String styling", async ({ page }) => {
            let view = new PspViewer(page);
            let table = view.dataGrid.regularTable;

            let col = await view.getOrCreateColumnByType("string");
            let name = await col.name.innerText();
            expect(name).toBeTruthy();
            let td = await table.getFirstCellByColumnName(name);
            await td.waitFor();

            // bg color
            await view.assureColumnSettingsOpen(col);
            await view.columnSettingsSidebar.openTab("style");
            let contents = view.columnSettingsSidebar.styleTab.contents;
            let checkbox = contents.locator("input[type=checkbox]").last();
            await checkbox.waitFor();

            let tdStyle = await td.evaluate((node) => node.style.cssText);
            let listener = await getEventListener(
                page,
                "perspective-column-style-change"
            );
            await checkbox.check();
            expect(await listener()).toBe(true);
            let newStyle = await td.evaluate((node) => node.style.cssText);
            expect(tdStyle).not.toBe(newStyle);
        });
    });
};

runTests("Datagrid Column Styles", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tools/perspective-test/src/html/basic-test.html");
        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });
    });

    // Keeping the column sidebar open makes this unncessary.
    test.skip("Edit highlights go away when view re-draws", async ({
        page,
    }) => {
        let viewer = new PspViewer(page);
        await viewer.openSettingsPanel();
        let btn = await viewer.dataGrid.regularTable.getEditBtnByName("Row ID");
        await btn.click();
        await viewer.settingsPanel.groupby("Ship Mode");
        await viewer.columnSettingsSidebar.container.waitFor({
            state: "detached",
        });

        await viewer.dataGrid.regularTable.openColumnEditBtn
            .first()
            .waitFor({ state: "detached" });
    });
});

// Data grid table header rows look different when a split-by is present.

// TODO: These tests are failing due to bunk selectors.
runTests("Datagrid Column Styles - Split-by", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(
            "/tools/perspective-test/src/html/superstore-test.html"
        );

        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });
    });

    test("Datagrid Column Styles - Only edit buttons get styled", async ({
        page,
    }) => {
        await page.goto(
            "/tools/perspective-test/src/html/superstore-test.html"
        );

        await page.evaluate(async () => {
            while (!window["__TEST_PERSPECTIVE_READY__"]) {
                await new Promise((x) => setTimeout(x, 10));
            }
        });
        let viewer = new PspViewer(page);
        let headers = viewer.dataGrid.regularTable.table
            .locator("thead")
            .filter({
                hasNot: page
                    .locator("#psp-column-titles")
                    .or(page.locator("#psp-column-edit-buttons")),
                has: page.locator("th.psp-menu-open"),
            });

        await viewer.openSettingsPanel();
        let btn = await viewer.dataGrid.regularTable.getEditBtnByName("Sales");
        await expect(btn).toBeVisible();
        await btn.click();
        await expect(headers).not.toBeAttached();
    });
});
