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

import { Locator, Page, expect } from "@playwright/test";
import { ColumnSettingsSidebar } from "./column_settings";
import { ColumnSelector, ColumnType, SettingsPanel } from "./settings_panel";
import { DataGridPlugin } from "./plugins";
import {
    IPerspectiveViewerElement,
    PerspectiveViewerConfig,
} from "@finos/perspective-viewer";

/**
 * This class is the primary interface between Playwright tests and the items on the Perspective Viewer.
 * It contains various subobjects such as the SettingsPanel and ColumnSettingsSidebar which contain their own
 * functionality and locators.
 */
export class PageView {
    readonly page: Page;
    container: Locator;
    settingsPanel: SettingsPanel;
    settingsCloseButton: Locator;
    /** Opens the settings panel. */
    settingsButton: Locator;
    columnSettingsSidebar: ColumnSettingsSidebar;

    // plugins
    dataGrid: DataGridPlugin.DataGrid;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator("perspective-viewer");
        this.settingsCloseButton = this.container.locator(
            "#settings_close_button"
        );
        this.settingsButton = this.container.locator("#settings_button");
        this.columnSettingsSidebar = new ColumnSettingsSidebar(this);
        this.settingsPanel = new SettingsPanel(this);

        this.dataGrid = new DataGridPlugin.DataGrid(page);
    }

    async save() {
        return this.container.evaluate(async (viewer) => {
            let el = viewer as unknown as IPerspectiveViewerElement;
            return await el.save();
        });
    }

    async restore(config: PerspectiveViewerConfig) {
        return this.container.evaluate(async (viewer, config) => {
            let el = viewer as unknown as IPerspectiveViewerElement;
            return await el.restore(config);
        }, config);
    }

    async openSettingsPanel() {
        if (await this.settingsPanel.container.isVisible()) {
            return this.settingsPanel;
        }
        await this.settingsButton.click();
        await this.settingsPanel.container.waitFor({ state: "visible" });
        return this.settingsPanel;
    }
    async closeSettingsPanel() {
        await this.settingsCloseButton.click();
        await this.settingsPanel.container.waitFor({ state: "hidden" });
    }

    async getOrCreateColumnByType(type: ColumnType) {
        let settingsPanel = this.settingsPanel;
        await this.openSettingsPanel();
        let col = settingsPanel.activeColumns.getColumnByType(type);
        if (await col.container.isHidden()) {
            let expr: string = "";
            switch (type) {
                case "string":
                    expr = "'foo'";
                    break;
                case "integer":
                    expr = "1";
                    break;
                case "float":
                    expr = "1.1";
                case "date":
                    expr = "date(0,0,0)";
                case "datetime":
                    expr = "now()";
                case "numeric":
                    expr = "1";
                case "calendar":
                    expr = "now()";
            }
            await this.settingsPanel.createNewExpression("expr", expr, true);
            await settingsPanel.activeColumns.activateColumn("expr");
            col = settingsPanel.activeColumns.getColumnByName("expr");
        }
        await expect(col.container).toBeVisible();
        return col;
    }

    async assureColumnSettingsOpen(column: ColumnSelector) {
        let isEditing = await column.editBtn.evaluate((btn) =>
            btn.className.includes("is-editing")
        );
        if (!isEditing) {
            await this.container.evaluate((_) =>
                console.log("COLUMN SETTINGS CLOSED")
            );
            await column.editBtn.click({ force: true });
        }
        expect(this.container).toBeVisible({ timeout: 1000 });
    }
    async assureColumnSettingsClosed() {
        if (await this.columnSettingsSidebar.container.isVisible()) {
            await this.columnSettingsSidebar.closeBtn.click();
        }
    }

    async getActiveElement() {
        return await this.container.evaluate((viewer) => {
            return viewer.shadowRoot?.activeElement;
        });
    }
}
