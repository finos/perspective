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

export class DataGrid {
    element: Locator;
    regularTable: RegularTable;

    constructor(page: Page) {
        this.element = page.locator("perspective-viewer-datagrid");
        this.regularTable = new RegularTable(this.element);
    }
}

export class RegularTable {
    element: Locator;
    table: Locator;
    columnTitleRow: Locator;
    editBtnRow: Locator;

    constructor(parent: Locator) {
        this.element = parent.locator("regular-table");
        this.table = this.element.locator("table");
        this.columnTitleRow = this.element.locator("#psp-column-titles");
        this.editBtnRow = this.element.locator("#psp-column-edit-buttons");
    }

    async getTitleIdx(name: string) {
        let ths = await this.columnTitleRow.locator("th").all();
        for (let [i, locator] of ths.entries()) {
            if ((await locator.innerText()) === name) {
                return i;
            }
        }
        return -1;
    }

    async getEditBtnByName(name: string) {
        let n = await this.getTitleIdx(name);
        expect(n).not.toBe(-1);
        return this.editBtnRow.locator("th").nth(n);
    }
    /**
     * Takes the name of a column and returns a locator for the first corresponding TD in the body.
     * @param name
     */
    async getFirstCellByColumnName(name: string) {
        let n = await this.getTitleIdx(name);
        expect(n).not.toBe(-1);
        return this.table.locator("tbody tr").first().locator("*").nth(n);
    }
}
