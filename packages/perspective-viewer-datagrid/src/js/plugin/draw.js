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

import { restore_column_size_overrides } from "../model/column_overrides.js";
import { save_column_size_overrides } from "../model/column_overrides.js";

/**
 * Draw this datagrid instance.
 *
 * @param {perspective.View} view
 * @returns
 */
export async function draw(view) {
    if (this.parentElement) {
        await this.activate(view);
    }

    if (!this.isConnected || this.offsetParent == null || !this.model) {
        return;
    }

    const old_sizes = save_column_size_overrides.call(this);
    const draw = this.regular_table.draw({ invalid_columns: true });
    if (this._reset_scroll_top) {
        // group_by
        this.regular_table.scrollTop = 0;
        this._reset_scroll_top = false;
    }

    if (this._reset_scroll_left) {
        // split_by
        this.regular_table.scrollLeft = 0;
        this._reset_scroll_left = false;
    }
    if (this._reset_select) {
        // filter, group_by, sort ... if (col-select) { columns, split_by }
        this.regular_table.dispatchEvent(
            new CustomEvent("psp-deselect-all", { bubbles: false }),
        );
        this._reset_select = false;
    }

    if (this._reset_column_size) {
        // split_by, group_by (?),
        this.regular_table._resetAutoSize();
        this._reset_column_size = false;
    }

    restore_column_size_overrides.call(this, old_sizes);
    await draw;

    this._toolbar.classList.toggle(
        "aggregated",
        this.model._config.group_by.length > 0 ||
            this.model._config.split_by.length > 0,
    );
}
