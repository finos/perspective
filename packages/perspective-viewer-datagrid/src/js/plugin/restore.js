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
import { toggle_edit_mode, toggle_scroll_lock } from "../model/toolbar.js";
import { PRIVATE_PLUGIN_SYMBOL } from "../model";
import { make_color_record } from "../color_utils.js";

/**
 * Restore this plugin's state from a previously saved `token`.
 *
 * @param {*} token A token returned from `save()`.
 * @param {*} columns Viewer column settings
 */
export function restore(token, columns) {
    console.log("restore(", token, ",", columns, ")");
    token = JSON.parse(JSON.stringify(token));
    columns = JSON.parse(JSON.stringify(columns));
    const overrides = {};

    if (token.columns) {
        for ([col, value] in Object.entries(token.columns)) {
            if (value.column_size_override !== undefined) {
                overrides[col_name] = value.column_size_override;
                delete value["column_size_override"];
            }
        }
    }

    if (columns) {
        for (const [col_name, type] of Object.entries(columns)) {
            for (const [col_type, control] of Object.entries(type)) {
                const value = control.styles; // temp
                if (value?.pos_fg_color) {
                    value.pos_fg_color = make_color_record(value.pos_fg_color);
                    value.neg_fg_color = make_color_record(value.neg_fg_color);
                }

                if (value?.pos_bg_color) {
                    value.pos_bg_color = make_color_record(value.pos_bg_color);
                    value.neg_bg_color = make_color_record(value.neg_bg_color);
                }

                if (value?.color) {
                    value.color = make_color_record(value.color);
                }

                if (Object.keys(value).length === 0) {
                    delete type[col_type];
                }
            }
            if (Object.keys(type).length === 0) {
                delete columns[col_name];
            } else {
                // this removes type-based settings in order to shim into the current format
                columns[col_name] = Object.values(type)[0].styles;
            }
        }
    }

    console.log("Columns after filtering:", columns);

    if ("editable" in token) {
        toggle_edit_mode.call(this, token.editable);
    }

    if ("scroll_lock" in token) {
        toggle_scroll_lock.call(this, token.scroll_lock);
    }

    const datagrid = this.regular_table;
    restore_column_size_overrides.call(this, overrides, true);
    datagrid[PRIVATE_PLUGIN_SYMBOL] = columns;
}
