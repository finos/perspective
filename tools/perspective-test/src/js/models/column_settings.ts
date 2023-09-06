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

import { Locator } from "@playwright/test";
import { PageView } from "./page";

export class ColumnSettingsSidebar {
    view: PageView;
    container: Locator;
    attributesTab: AttributesTab;
    styleTab: StyleTab;
    closeBtn: Locator;
    tabTitle: Locator;

    constructor(view: PageView) {
        this.view = view;
        const viewer = view.container;
        this.container = viewer.locator("#column_settings_sidebar");
        this.attributesTab = new AttributesTab(this.container);
        this.styleTab = new StyleTab(this.container);
        this.closeBtn = viewer.locator("#column_settings_close_button");
        this.tabTitle = view.container.locator(
            ".tab:not(.tab-padding) .tab-title"
        );
    }
}

export class AttributesTab {
    container: Locator;
    expressionEditor: ExpressionEditor;

    constructor(parent: Locator) {
        this.container = parent.locator("#attributes-tab");
        this.expressionEditor = new ExpressionEditor(this.container);
    }
}

export class ExpressionEditor {
    container: Locator;
    content: Locator;
    saveBtn: Locator;
    resetBtn: Locator;
    deleteBtn: Locator;

    constructor(parent: Locator) {
        this.container = parent.locator("#editor-container");
        this.content = this.container.locator("#content");
        this.saveBtn = this.container.locator(
            "#psp-expression-editor-button-save"
        );
        this.resetBtn = this.container.locator(
            "#psp-expression-editor-button-reset"
        );
        this.saveBtn = this.container.locator(
            "#psp-expression-editor-button-delete"
        );
    }
}

export class StyleTab {
    container: Locator;
    contents: Locator;
    constructor(parent: Locator) {
        this.container = parent.locator("#style-tab");
        this.contents = parent.locator(".style_contents");
    }
}
