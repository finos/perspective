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

import { Locator, Page, expect, test } from "@playwright/test";
import { PageView } from "./page";

export class SettingsPanel {
    pageView: PageView;
    container: Locator;
    closeButton: Locator;
    // TODO: Don't nest these, it's confusing.
    activeColumns: ActiveColumns;
    inactiveColumns: InactiveColumns;
    addExpressionButton: Locator;
    pluginSelector: Locator;

    constructor(view: PageView) {
        this.pageView = view;
        const viewer = view.container;
        this.container = viewer.locator("#settings_panel");
        this.closeButton = viewer.locator("#settings_close_button");
        this.activeColumns = new ActiveColumns(this.pageView);
        this.inactiveColumns = new InactiveColumns(this.pageView);
        this.addExpressionButton = viewer.locator("#add-expression");
        this.pluginSelector = viewer.locator("#plugin_selector_container");
    }
    /**
     * Creates and saves a new expression column.
     * @param expr
     */
    async createNewExpression(name: string, expr: string) {
        await this.activeColumns.scrollToBottom();
        await this.addExpressionButton.click();
        let exprEditor =
            this.pageView.columnSettingsSidebar.attributesTab.expressionEditor;
        await exprEditor.container.waitFor({
            state: "visible",
        });
        expect(await exprEditor.content.isVisible()).toBe(true);
        // brute force clear the expression editor
        for (let i = 0; i < 30; i++) {
            await exprEditor.content.press("Backspace", { delay: 10 });
        }
        await exprEditor.content.type(`//${name}\n${expr}`, { delay: 100 });
        await exprEditor.content.blur();
        let saveBtn = this.pageView.page.locator(
            "#psp-expression-editor-button-save"
        );
        expect(await saveBtn.isDisabled()).toBe(false);
        await saveBtn.click();
        await this.inactiveColumns.getColumnByName(name);
    }
    /**
     * Selects a plugin by it's display name, i.e. the innerText of the .plugin-select-item
     * @param name
     */
    async selectPlugin(name: string) {
        await this.pluginSelector.click();
        await this.pluginSelector
            .locator(".plugin-select-item")
            .filter({ hasText: name })
            .click();
    }
}

export class ColumnSelector {
    active: boolean;
    name: Locator;
    container: Locator;
    editBtn: Locator;
    aggSelector: Locator;

    constructor(container: Locator, active: boolean) {
        this.container = container;
        this.active = active;
        this.name = container.locator("div .column_name");
        this.aggSelector = container.locator("select");
        this.editBtn = container.locator("div .expression-edit-button");
    }
}

export type ColumnType =
    | "integer"
    | "float"
    | "string"
    | "date"
    | "datetime"
    | "numeric"
    | "calendar";

// TODO: Consolidate this and InactiveColumns into a super class
export class ActiveColumns {
    view: PageView;
    page: Page;
    container: Locator;
    topPanel: Locator;
    columnSelector: Locator;
    newColumnInput: Locator;

    constructor(view: PageView) {
        this.page = view.page;
        this.view = view;
        this.container = view.container.locator("#active-columns");
        this.topPanel = view.container.locator("#top_panel");
        this.columnSelector = view.container.locator(".column-selector-column");
        this.newColumnInput = view.container.locator(
            ".column-selector-column .column-empty input"
        );
    }

    getFirstVisibleColumn() {
        return new ColumnSelector(this.columnSelector.first(), true);
    }

    getColumnByName(name: string) {
        let locator = this.columnSelector.filter({
            hasText: name,
        });
        return new ColumnSelector(locator, true);
    }

    /**
     * Gets the first visible column matching the passed in type.
     * @param type - A string to denote the type. Use "numeric" to mean "integer or float" and "calendar" to denote "date or datetime"
     */
    getColumnByType(type: ColumnType) {
        let page = this.view.page;
        let has: Locator;
        switch (type) {
            case "numeric":
                has = page.locator(".float").or(page.locator(".integer"));
                break;
            case "calendar":
                has = page.locator(".date").or(page.locator(".datetime"));
                break;
            default:
                has = page.locator(`.${type}`);
                break;
        }
        return new ColumnSelector(
            this.columnSelector.filter({ has }).first(),
            true
        );
    }

    async visibleColumns() {
        let all = await this.columnSelector.all();
        let mapped = all.map((locator) => {
            return new ColumnSelector(locator, true);
        });
        return mapped;
    }

    async scrollToTop() {
        this.container.focus();
        await this.container.evaluate((node) => (node.scrollTop = 0));
    }
    async scrollToBottom() {
        this.container.focus();
        await this.container.evaluate(
            (node) => (node.scrollTop = node.scrollHeight)
        );
    }

    async toggleColumn(name: string) {
        let has = this.view.page.getByText(name);
        this.columnSelector
            .filter({ has })
            .locator(".is_column_active")
            .click();
    }
    /**
     * This function will use the empty input column to activate a column.
     * During this process, it will scroll ActiveColumns to the bottom.
     * @param name
     */
    async activateColumn(name: string) {
        await this.scrollToBottom();
        await this.newColumnInput.waitFor({ state: "visible" });
        await this.newColumnInput.type(name);
        await this.page
            .locator("perspective-dropdown .selected")
            .first() // NOTE: There probably shouldn't actually be more than one.
            .waitFor();
        await this.newColumnInput.press("Enter");
        let addedColumn = this.columnSelector.filter({ hasText: name }).first();
        return new ColumnSelector(addedColumn!, true);
    }
}

export class InactiveColumns {
    view: PageView;
    container: Locator;
    columnSelector: Locator;

    constructor(view: PageView) {
        this.view = view;
        this.container = view.container.locator("#sub-columns");
        this.columnSelector = view.container.locator(".column-selector-column");
    }

    async getColumnByName(name: string) {
        await this.container.waitFor({ state: "visible" });
        let locator = this.columnSelector.filter({ hasText: name });
        return new ColumnSelector(locator, true);
    }
    async visibleColumns() {
        let all = await this.columnSelector.all();
        let mapped = all.map((locator) => {
            return new ColumnSelector(locator, false);
        });
        return mapped;
    }
    /**
     * This function will click the toggle next to the inactive column,
     * making it the only active column.
     * @param name
     */
    async toggleColumn(name: string) {
        this.columnSelector
            .filter({ has: this.container.getByText(name) })
            .locator(".is_column_active")
            .click();
    }
    /**
     * Gets the first visible column matching the passed in type.
     * @param type - A string to denote the type. Use "numeric" to mean "integer or float" and "calendar" to denote "date or datetime"
     */
    getColumnByType(
        type:
            | "integer"
            | "float"
            | "string"
            | "date"
            | "datetime"
            | "numeric"
            | "calendar"
    ) {
        let page = this.view.page;
        let has: Locator;
        switch (type) {
            case "numeric":
                has = page.locator(".float").or(page.locator(".integer"));
                break;
            case "calendar":
                has = page.locator(".date").or(page.locator(".datetime"));
                break;
            default:
                has = page.locator(`.${type}`);
                break;
        }
        return new ColumnSelector(
            this.columnSelector.filter({ has }).first(),
            true
        );
    }
}
