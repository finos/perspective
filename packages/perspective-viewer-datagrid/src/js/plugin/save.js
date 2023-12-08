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

import { PRIVATE_PLUGIN_SYMBOL } from "../model";
import { save_column_size_overrides } from "../model/column_overrides.js";
import { VIEWER_TO_PLUGIN_MAP } from "./restore.js";

export const EXCLUDED_KEYS = Object.values(VIEWER_TO_PLUGIN_MAP);

/**
 * Serialize the state of this plugin to a token.
 *
 * @returns This plugin's state as a token.
 */
export function save() {
    if (this.regular_table) {
        const datagrid = this.regular_table;
        const token = {
            columns: {},
            scroll_lock: !!this._is_scroll_lock,
            editable: !!this._is_edit_mode,
        };

        for (const col of Object.keys(datagrid[PRIVATE_PLUGIN_SYMBOL] || {})) {
            const config = Object.assign(
                {},
                datagrid[PRIVATE_PLUGIN_SYMBOL][col]
            );
            if (config?.pos_fg_color || config?.pos_bg_color) {
                config.pos_fg_color = config.pos_fg_color?.[0];
                config.neg_fg_color = config.neg_fg_color?.[0];
                config.pos_bg_color = config.pos_bg_color?.[0];
                config.neg_bg_color = config.neg_bg_color?.[0];
            }

            if (config?.color) {
                config.color = config.color[0];
            }

            token.columns[col] = config;
        }

        const column_size_overrides = save_column_size_overrides.call(this);

        for (const col of Object.keys(column_size_overrides || {})) {
            if (!token.columns[col]) {
                token.columns[col] = {};
            }

            token.columns[col].column_size_override =
                column_size_overrides[col];
        }

        for (let col_name in token?.columns ?? {}) {
            let col_props = token.columns[col_name];
            for (let prop_name in col_props ?? {}) {
                if (EXCLUDED_KEYS.includes(prop_name)) {
                    delete col_props[prop_name];
                }
            }
            if (col_props && Object.keys(col_props).length === 0) {
                delete token.columns[col_name];
            }
        }
        if (token.columns && Object.keys(token.columns).length === 0) {
            delete token.columns;
        }

        return JSON.parse(JSON.stringify(token));
    }
    return {};
}
