/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {restore_column_size_overrides} from "../model/column_overrides.js";
import {save_column_size_overrides} from "../model/column_overrides.js";

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

    if (!this.isConnected || this.offsetParent == null) {
        return;
    }

    const old_sizes = save_column_size_overrides.call(this);
    const draw = this.regular_table.draw({invalid_columns: true});
    if (!this.model._preserve_focus_state) {
        this.regular_table.scrollTop = 0;
        this.regular_table.scrollLeft = 0;
        this.regular_table.dispatchEvent(
            new CustomEvent("psp-deselect-all", {bubbles: false})
        );
        this.regular_table._resetAutoSize();
    } else {
        this.model._preserve_focus_state = false;
    }

    restore_column_size_overrides.call(this, old_sizes);
    await draw;

    this._toolbar.classList.toggle(
        "aggregated",
        this.model._config.group_by.length > 0 ||
            this.model._config.split_by.length > 0
    );
}
