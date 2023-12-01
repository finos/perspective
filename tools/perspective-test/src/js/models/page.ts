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
import { ColumnType, SettingsPanel } from "./settings_panel";
import { DataGridPlugin } from "./plugins";

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

    async restore(settings: any) {
        this.container.evaluate(async (viewer, settings) => {
            viewer!.toggleConfig(true);
            await viewer!.restore(settings);
        }, settings);
    }
}
