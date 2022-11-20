/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { restore_column_size_overrides } from "../model/column_overrides.js";
import { toggle_edit_mode, toggle_scroll_lock } from "../model/toolbar.js";
import { PRIVATE_PLUGIN_SYMBOL } from "../model";
import { make_color_record } from "../color_utils.js";

/**
 * Restore this plugin's state from a previously saved `token`.
 *
 * @param {*} token A token returned from `save()`.
 */
export function restore(token) {
    token = JSON.parse(JSON.stringify(token));
    const overrides = {};
    if (token.columns) {
        for (const col of Object.keys(token.columns)) {
            const col_config = token.columns[col];
            if (col_config.column_size_override !== undefined) {
                overrides[col] = col_config.column_size_override;
                delete col_config["column_size_override"];
            }

            if (col_config?.pos_fg_color) {
                col_config.pos_fg_color = make_color_record(
                    col_config.pos_fg_color
                );
                col_config.neg_fg_color = make_color_record(
                    col_config.neg_fg_color
                );
            }

            if (col_config?.pos_bg_color) {
                col_config.pos_bg_color = make_color_record(
                    col_config.pos_bg_color
                );
                col_config.neg_bg_color = make_color_record(
                    col_config.neg_bg_color
                );
            }

            if (col_config?.color) {
                col_config.color = make_color_record(col_config.color);
            }

            if (Object.keys(col_config).length === 0) {
                delete token.columns[col];
            }
        }
    }

    if ("editable" in token) {
        toggle_edit_mode.call(this, token.editable);
    }

    if ("scroll_lock" in token) {
        toggle_scroll_lock.call(this, token.scroll_lock);
    }

    const datagrid = this.regular_table;
    try {
        datagrid._resetAutoSize();
    } catch (e) {
        // Do nothing;  this may fail if no auto size info has been read.
        // TODO fix this regular-table API
    }

    restore_column_size_overrides.call(this, overrides, true);
    datagrid[PRIVATE_PLUGIN_SYMBOL] = token.columns;
}
