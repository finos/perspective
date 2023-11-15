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
    nameInput: Locator;

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
        this.nameInput = view.container.locator("input.sidebar_header_title");
    }

    async openTab(name: string) {
        let locator = this.tabTitle.filter({ hasText: name });
        await locator.click();
        await this.container
            .locator(".tab.selected", { hasText: name })
            .waitFor({ timeout: 1000 });
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
    textarea: Locator;
    saveBtn: Locator;
    resetBtn: Locator;
    deleteBtn: Locator;

    constructor(parent: Locator) {
        this.container = parent.locator("#editor-container");
        this.content = this.container.locator("#content");
        this.textarea = this.container.locator("textarea");
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
    symbolsEditor: SymbolsEditor;

    constructor(parent: Locator) {
        this.container = parent.locator("#style-tab");
        this.contents = parent.locator(".style_contents");
        this.symbolsEditor = new SymbolsEditor(this.container);
    }
}
export class SymbolsEditor {
    container: Locator;
    pairsList: Locator;

    constructor(parent: Locator) {
        this.container = parent.locator("#attributes-symbols");
        this.pairsList = this.container.locator("ul");
    }
    async getSymbolPairs() {
        const names = await this.pairsList
            .locator(".column_name")
            .allInnerTexts();
        const symbols = await this.pairsList
            .locator("option[selected]")
            .allInnerTexts();
        const zipped: SymbolPair[] = [];
        for (let i = 0; i < names.length; i++) {
            zipped.push(new SymbolPair(names[i], symbols[i]));
        }
        return zipped;
    }
    async getPairsLength() {
        return (await this.pairsList.locator("li").all()).length;
    }
}
export class SymbolPair {
    key: String;
    value: String;
    constructor(key: String, value: String) {
        this.key = key;
        this.value = value;
    }
}
