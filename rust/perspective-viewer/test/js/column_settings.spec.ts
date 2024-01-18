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
import { PageView } from "@finos/perspective-test";
import { ColumnSettingsSidebar } from "@finos/perspective-test/src/js/models/column_settings";

test.beforeEach(async ({ page }) => {
    await page.goto("/tools/perspective-test/src/html/basic-test.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });
});
export async function checkTab(
    columnSettingsSidebar: ColumnSettingsSidebar,
    active: boolean,
    expression: boolean,
    hasStyles: boolean = true
) {
    await columnSettingsSidebar.container.waitFor({
        state: "visible",
    });
    let titles = await columnSettingsSidebar.tabTitle.all();
    if (active) {
        if (expression) {
            if (hasStyles) {
                expect(await titles[0].innerText()).toBe("Style");
                expect(await titles[1].innerText()).toBe("Attributes");
            } else {
                expect(await titles[0].innerText()).toBe("Attributes");
            }
        } else {
            expect(await titles[0].innerText()).toBe("Style");
        }
    } else {
        if (expression) {
            expect(titles.length).toBe(1);
            expect(await titles[0].innerText()).toBe("Attributes");
        } else {
            test.fail(
                true,
                "No settings exist for non-expression, inactive columns!"
            );
        }
    }
}

test.describe("Plugin Styles", () => {
    test("Active column edit buttons open sidebar", async ({ page }) => {
        let view = new PageView(page);
        let settingsPanel = await view.openSettingsPanel();
        let inactiveColumns = settingsPanel.inactiveColumns;
        let activeColumns = settingsPanel.activeColumns;

        await settingsPanel.createNewExpression("expr", "true");
        await inactiveColumns.container.waitFor({
            state: "visible",
        });
        let exprCol = await activeColumns.activateColumn("expr");
        let firstCol = await activeColumns.getFirstVisibleColumn();

        firstCol.editBtn.waitFor();
        await firstCol.editBtn.click();
        await checkTab(view.columnSettingsSidebar, true, false, false);

        await activeColumns.scrollToBottom();
        exprCol.editBtn.waitFor();
        await exprCol.editBtn.click();
        await checkTab(view.columnSettingsSidebar, true, true, false);
    });
    test("Inactive column edit buttons open sidebar", async ({ page }) => {
        let view = new PageView(page);
        let settingsPanel = await view.openSettingsPanel();
        let inactiveColumns = settingsPanel.inactiveColumns;
        let activeColumns = settingsPanel.activeColumns;

        await settingsPanel.createNewExpression("expr", "true");
        let exprCol = await inactiveColumns.getColumnByName("expr");
        await activeColumns.toggleColumn("Row ID");
        let rowId = await inactiveColumns.getColumnByName("Row ID");
        expect(exprCol).toBeDefined();
        expect(rowId).toBeDefined();

        await exprCol.editBtn.waitFor();
        await rowId.editBtn.waitFor({ state: "detached", timeout: 1000 });

        await view.assureColumnSettingsClosed();
        await exprCol.editBtn.click();
        await checkTab(view.columnSettingsSidebar, false, true);
    });
    test("Click to change tabs", async ({ page }) => {
        let view = new PageView(page);
        let settingsPanel = await view.openSettingsPanel();
        let sidebar = view.columnSettingsSidebar;
        let activeColumns = settingsPanel.activeColumns;
        let inactiveColumns = settingsPanel.inactiveColumns;

        await settingsPanel.createNewExpression("expr", "'string'");
        await activeColumns.activateColumn("expr");
        let col = activeColumns.getColumnByName("expr");
        await inactiveColumns.container.waitFor({ state: "hidden" });
        await activeColumns.scrollToBottom();
        await view.assureColumnSettingsOpen(col);
        await checkTab(sidebar, true, true, true);
        let tabs = await sidebar.tabTitle.all();
        await tabs[1].click();
        await sidebar.attributesTab.container.waitFor();
        await tabs[0].click();
        await sidebar.styleTab.container.waitFor();
    });
    test("View updates don't re-render sidebar", async ({ page }) => {
        await page.evaluate(async () => {
            let table = await window.__TEST_WORKER__.table({ x: [0] });
            window.__TEST_TABLE__ = table;
            let viewer = document.querySelector("perspective-viewer");
            viewer?.load(table);
        });

        let view = new PageView(page);
        let settingsPanel = await view.openSettingsPanel();
        let col = settingsPanel.activeColumns.getFirstVisibleColumn();
        await col.editBtn.click();
        await view.columnSettingsSidebar.container.waitFor();
        await page.evaluate(() => {
            window.__TEST_TABLE__.update({ x: [1] });
        });
        await page.locator("tbody tr").nth(1).waitFor();
        await expect(view.columnSettingsSidebar.container).toBeVisible();
    });
    test("Column settings should not shrink", async ({ page }) => {
        let view = new PageView(page);

        const MAX_WIDTH = 300;
        let checkWidth = async () => {
            let width = await view.columnSettingsSidebar.container.evaluate(
                (sidebar) => sidebar.getBoundingClientRect().width
            );
            expect(width).toEqual(MAX_WIDTH);
        };

        let settings = await view.openSettingsPanel();
        await settings.activeColumns.scrollToBottom();
        await settings.addExpressionButton.click();
        let editor = view.columnSettingsSidebar.attributesTab.expressionEditor;
        await editor.textarea.focus();
        await editor.textarea.clear();
        // NOTE: We should find another way to test this as the trick used here is probably not a desired feature.
        // This creates an error which then expands the sidebar to max width.
        await editor.textarea.type(
            "'0000000000000000000000000000000000000000000000000000000000"
        );
        await checkWidth();
        await editor.textarea.clear();
        await checkWidth();
    });
    test("Selected tab stays selected when manipulating column", async ({
        page,
    }) => {
        const view = new PageView(page);
        view.restore({
            expressions: {
                expr: "1234",
            },
            columns: ["Row ID"],
            settings: true,
        });

        const col = await view.settingsPanel.inactiveColumns.getColumnByName(
            "expr"
        );
        await col.editBtn.click();
        await view.columnSettingsSidebar.openTab("Attributes");
        await checkTab(view.columnSettingsSidebar, false, true);
        const selectedTab = async () => {
            return await view.columnSettingsSidebar.selectedTab.innerText();
        };
        expect(await selectedTab()).toBe("Attributes");
        await col.activeBtn.click();
        await checkTab(view.columnSettingsSidebar, true, true, true);
        expect(await selectedTab()).toBe("Attributes");
        await view.columnSettingsSidebar.attributesTab.expressionEditor.textarea.type(
            "'new expr value'"
        );
        await view.columnSettingsSidebar.attributesTab.saveBtn.click();
        expect(await selectedTab()).toBe("Attributes");
    });
});
